import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/authz";
import { consumeRateLimit } from "@/lib/rateLimit";
import { logServerEvent } from "@/lib/serverLogger";

export const dynamic = "force-dynamic";

const reportSchema = z.object({
  listingId: z.string().uuid(),
  reason: z.enum(["scam", "fee_upfront", "inappropriate", "spam", "other"]),
  details: z.string().trim().max(400).optional().nullable(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to report." }, { status: 401 });
  }

  const limit = consumeRateLimit({
    key: `job-listing-report:${user.id}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many reports." }, { status: 429 });
  }

  let parsed: z.infer<typeof reportSchema>;
  try {
    const result = reportSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json({ error: "Invalid report." }, { status: 400 });
    }
    parsed = result.data;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { data: listing } = await supabase
    .from("job_listings")
    .select("id,poster_id,status")
    .eq("id", parsed.listingId)
    .maybeSingle();

  if (!listing || listing.status !== "published") {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }
  if (listing.poster_id === user.id) {
    return NextResponse.json({ error: "You cannot report your own listing." }, { status: 400 });
  }

  const { error } = await supabase.from("job_listing_reports").insert({
    listing_id: parsed.listingId,
    reporter_id: user.id,
    reason: parsed.reason,
    details: parsed.details?.trim() || null,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "You already reported this job." }, { status: 409 });
    }
    logServerEvent("error", "job_listing_report_failed", { message: error.message });
    return NextResponse.json({ error: "Could not submit report." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
