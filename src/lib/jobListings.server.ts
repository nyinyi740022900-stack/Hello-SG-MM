import { createClient } from "@supabase/supabase-js";
import {
  JOB_LISTING_COLUMNS,
  type JobListingRow,
  type JobListingStatus,
} from "@/lib/jobListings";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function anonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Published jobs — featured first, then newest. */
export async function listPublishedJobListings(
  limit = 40,
): Promise<JobListingRow[]> {
  const db = anonClient();
  if (!db) return [];

  const nowIso = new Date().toISOString();
  const { data, error } = await db
    .from("job_listings")
    .select(JOB_LISTING_COLUMNS)
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("featured_until", { ascending: false, nullsFirst: false })
    .order("published_at", { ascending: false })
    .limit(limit)
    .returns<JobListingRow[]>();

  if (error) {
    console.error("[listPublishedJobListings]", error.message);
    return [];
  }

  const rows = data ?? [];
  // Stable featured-first sort (active featured only).
  return [...rows].sort((a, b) => {
    const af = a.featured_until && a.featured_until > nowIso ? 1 : 0;
    const bf = b.featured_until && b.featured_until > nowIso ? 1 : 0;
    if (bf !== af) return bf - af;
    return (b.published_at ?? "").localeCompare(a.published_at ?? "");
  });
}

export async function getPublishedJobListing(
  id: string,
): Promise<JobListingRow | null> {
  const db = anonClient();
  if (!db) return null;

  const nowIso = new Date().toISOString();
  const { data, error } = await db
    .from("job_listings")
    .select(JOB_LISTING_COLUMNS)
    .eq("id", id)
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .maybeSingle();

  if (error) {
    console.error("[getPublishedJobListing]", error.message);
    return null;
  }
  return (data as JobListingRow | null) ?? null;
}

export async function listAdminJobListings(
  status?: JobListingStatus,
): Promise<JobListingRow[]> {
  const db = serviceClient();
  if (!db) return [];

  let query = db
    .from("job_listings")
    .select(JOB_LISTING_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("status", status);

  const { data, error } = await query.returns<JobListingRow[]>();
  if (error) {
    console.error("[listAdminJobListings]", error.message);
    return [];
  }
  return data ?? [];
}

/** Activate featured boost after job_featured payment completes. */
export async function activateJobFeaturedFromPayment(params: {
  jobId: string;
  featuredUntilIso: string;
}): Promise<{ error: string | null }> {
  const db = serviceClient();
  if (!db) return { error: "Server not configured." };

  const { error } = await db
    .from("job_listings")
    .update({ featured_until: params.featuredUntilIso })
    .eq("id", params.jobId)
    .eq("status", "published");

  return { error: error?.message ?? null };
}

export type JobApplicationWithJob = {
  id: string;
  job_id: string;
  applicant_id: string;
  cover_note: string;
  cv_path: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  job_listings: {
    id: string;
    title: string;
    poster_id: string;
    status: string;
  } | null;
};

/** Applications for jobs owned by posterId (agency inbox). */
export async function listApplicationsForPoster(
  posterId: string,
): Promise<JobApplicationWithJob[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data: jobs } = await db
    .from("job_listings")
    .select("id")
    .eq("poster_id", posterId);

  const jobIds = (jobs ?? []).map((j) => j.id);
  if (jobIds.length === 0) return [];

  const { data, error } = await db
    .from("job_applications")
    .select(
      "id,job_id,applicant_id,cover_note,cv_path,status,created_at,updated_at,job_listings(id,title,poster_id,status)",
    )
    .in("job_id", jobIds)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[listApplicationsForPoster]", error.message);
    return [];
  }

  // PostgREST may type the embed as an array; normalize to a single object.
  return normalizeApplicationRows(data as Record<string, unknown>[] | null);
}

/** Jobs posted by this user (any status). */
export async function listJobsForPoster(posterId: string) {
  const db = serviceClient();
  if (!db) return [];

  const { data, error } = await db
    .from("job_listings")
    .select(JOB_LISTING_COLUMNS)
    .eq("poster_id", posterId)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<JobListingRow[]>();

  if (error) {
    console.error("[listJobsForPoster]", error.message);
    return [];
  }
  return data ?? [];
}

function normalizeApplicationRows(
  data: Record<string, unknown>[] | null,
): JobApplicationWithJob[] {
  return (data ?? []).map((row) => {
    const embed = row.job_listings as
      | JobApplicationWithJob["job_listings"]
      | JobApplicationWithJob["job_listings"][]
      | null;
    const job = Array.isArray(embed) ? (embed[0] ?? null) : embed;
    return {
      id: row.id as string,
      job_id: row.job_id as string,
      applicant_id: row.applicant_id as string,
      cover_note: row.cover_note as string,
      cv_path: (row.cv_path as string | null) ?? null,
      status: row.status as string,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      job_listings: job,
    };
  });
}

/** Applications submitted by this worker — Account “My applications”. */
export async function listApplicationsForApplicant(
  applicantId: string,
): Promise<JobApplicationWithJob[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data, error } = await db
    .from("job_applications")
    .select(
      "id,job_id,applicant_id,cover_note,cv_path,status,created_at,updated_at,job_listings(id,title,poster_id,status)",
    )
    .eq("applicant_id", applicantId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[listApplicationsForApplicant]", error.message);
    return [];
  }
  return normalizeApplicationRows(data as Record<string, unknown>[] | null);
}
