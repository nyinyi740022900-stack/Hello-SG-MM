import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/authz";
import { checkJobPostQuota } from "@/lib/listingQuotas.server";
import { logServerEvent } from "@/lib/serverLogger";
import {
  JOB_LISTING_COLUMNS,
  MAX_JOB_IMAGES,
  looksLikeFeeUpfrontScam,
} from "@/lib/jobListings";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().min(30).max(3000),
  sector: z.string().trim().min(2).max(80),
  locationArea: z.string().trim().min(2).max(80),
  salaryText: z.string().trim().max(120).optional().nullable(),
  contact: z.string().trim().min(6).max(120),
  momLicence: z.string().trim().min(3).max(80),
  imagePaths: z.array(z.string().trim().min(1).max(500)).max(MAX_JOB_IMAGES).default([]),
});

/** Agency/admin creates a pending job listing. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to post a job." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile as { role?: string } | null)?.role;
  if (role !== "agency" && role !== "admin") {
    return NextResponse.json(
      { error: "Only verified agency accounts can post jobs." },
      { status: 403 },
    );
  }

  const quota = await checkJobPostQuota(user.id);
  if (!quota.ok) {
    return NextResponse.json(
      { error: quota.message, code: quota.code },
      { status: 429 },
    );
  }

  let parsed: z.infer<typeof postSchema>;
  try {
    const result = postSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid listing." },
        { status: 400 },
      );
    }
    parsed = result.data;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const blob = `${parsed.title} ${parsed.description} ${parsed.contact}`;
  if (looksLikeFeeUpfrontScam(blob)) {
    return NextResponse.json(
      {
        error:
          "Listings that ask for an application/processing fee are not allowed.",
      },
      { status: 400 },
    );
  }
  if (/\b(FIN|NRIC|passport)\b/i.test(blob) && /\d{3}[A-Za-z]?\b/.test(blob)) {
    return NextResponse.json(
      { error: "Do not include passport, FIN or NRIC numbers." },
      { status: 400 },
    );
  }

  for (const path of parsed.imagePaths) {
    if (!path.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: "Invalid photo path." }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("job_listings")
    .insert({
      poster_id: user.id,
      title: parsed.title,
      description: parsed.description,
      sector: parsed.sector,
      location_area: parsed.locationArea,
      salary_text: parsed.salaryText?.trim() || null,
      contact: parsed.contact,
      mom_licence: parsed.momLicence,
      image_paths: parsed.imagePaths,
      status: "pending",
    })
    .select(JOB_LISTING_COLUMNS)
    .single();

  if (error) {
    logServerEvent("error", "job_listing_create_failed", { message: error.message });
    return NextResponse.json({ error: "Could not save listing." }, { status: 500 });
  }

  return NextResponse.json({ listing: data }, { status: 201 });
}
