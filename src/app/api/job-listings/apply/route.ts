import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/authz";
import { consumeRateLimit } from "@/lib/rateLimit";
import { logServerEvent } from "@/lib/serverLogger";
import { JOB_APPLICATION_COLUMNS } from "@/lib/jobListings";

export const dynamic = "force-dynamic";

const applySchema = z.object({
  jobId: z.string().uuid(),
  coverNote: z.string().trim().min(10).max(1500),
  cvPath: z.string().trim().min(1).max(500).optional().nullable(),
});

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Worker applies to a published job (optional private CV path). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to apply." }, { status: 401 });
  }

  const limit = consumeRateLimit({
    key: `job-apply:${user.id}`,
    limit: 20,
    windowMs: 24 * 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many applications today." },
      { status: 429 },
    );
  }

  let parsed: z.infer<typeof applySchema>;
  try {
    const result = applySchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid application." },
        { status: 400 },
      );
    }
    parsed = result.data;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (parsed.cvPath && !parsed.cvPath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Invalid CV path." }, { status: 400 });
  }

  // Use service role to verify published job (anon RLS may hide from poster edge cases).
  const db = serviceClient();
  if (!db) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const { data: job } = await db
    .from("job_listings")
    .select("id,poster_id,status,expires_at")
    .eq("id", parsed.jobId)
    .maybeSingle();

  if (
    !job ||
    job.status !== "published" ||
    (job.expires_at && new Date(job.expires_at) <= new Date())
  ) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }
  if (job.poster_id === user.id) {
    return NextResponse.json({ error: "You cannot apply to your own job." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("job_applications")
    .insert({
      job_id: parsed.jobId,
      applicant_id: user.id,
      cover_note: parsed.coverNote,
      cv_path: parsed.cvPath?.trim() || null,
      status: "pending",
    })
    .select(JOB_APPLICATION_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You already applied to this job." },
        { status: 409 },
      );
    }
    logServerEvent("error", "job_apply_failed", { message: error.message });
    return NextResponse.json({ error: "Could not submit application." }, { status: 500 });
  }

  return NextResponse.json({ application: data }, { status: 201 });
}
