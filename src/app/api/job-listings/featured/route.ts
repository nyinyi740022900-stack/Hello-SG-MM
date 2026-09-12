import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/authz";
import { consumeRateLimit } from "@/lib/rateLimit";
import { logServerEvent } from "@/lib/serverLogger";
import {
  JOB_FEATURED_PRICE_SGD,
  JOB_FEATURED_PURPOSE,
} from "@/lib/jobListings";

export const dynamic = "force-dynamic";

const schema = z.object({
  jobId: z.string().uuid(),
  method: z.enum(["kpay", "wavepay"]),
  transactionReference: z.string().trim().min(3).max(120),
  receiptPath: z.string().trim().min(1).max(500),
  note: z.string().trim().max(400).optional().nullable(),
});

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Agency pays for Featured boost (KPay/WavePay).
 * payments.reference_id = jobId so admin approval can activate featured_until.
 * Transaction ref is stored in admin_note alongside optional note.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const limit = consumeRateLimit({
    key: `job-featured:${user.id}`,
    limit: 10,
    windowMs: 24 * 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many payment submissions." }, { status: 429 });
  }

  let parsed: z.infer<typeof schema>;
  try {
    const result = schema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid payment." },
        { status: 400 },
      );
    }
    parsed = result.data;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!parsed.receiptPath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Invalid receipt path." }, { status: 400 });
  }

  const db = serviceClient();
  if (!db) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const { data: job } = await db
    .from("job_listings")
    .select("id,poster_id,status")
    .eq("id", parsed.jobId)
    .maybeSingle();

  if (!job || job.status !== "published") {
    return NextResponse.json({ error: "Published job not found." }, { status: 404 });
  }
  if (job.poster_id !== user.id) {
    return NextResponse.json({ error: "Only the poster can boost this job." }, { status: 403 });
  }

  const noteParts = [
    `txn:${parsed.transactionReference}`,
    parsed.note?.trim() || null,
  ].filter(Boolean);

  const { error } = await db.from("payments").insert({
    user_id: user.id,
    type: parsed.method,
    amount: JOB_FEATURED_PRICE_SGD,
    currency: "SGD",
    purpose: JOB_FEATURED_PURPOSE,
    reference_id: parsed.jobId,
    receipt_path: parsed.receiptPath,
    admin_note: noteParts.join(" · "),
    status: "pending",
  });

  if (error) {
    logServerEvent("error", "job_featured_payment_failed", { message: error.message });
    return NextResponse.json({ error: "Could not submit payment." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
