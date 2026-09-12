/**
 * Agency job board (Phase B) — separate from news `work` category.
 */

export type JobListingStatus =
  | "pending"
  | "published"
  | "rejected"
  | "expired";

export type JobApplicationStatus = "pending" | "reviewed" | "closed";

export type JobListingRow = {
  id: string;
  poster_id: string;
  title: string;
  description: string;
  sector: string;
  location_area: string;
  salary_text: string | null;
  contact: string;
  mom_licence: string | null;
  image_paths: string[];
  status: JobListingStatus;
  admin_note: string | null;
  report_count: number;
  featured_until: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type JobApplicationRow = {
  id: string;
  job_id: string;
  applicant_id: string;
  cover_note: string;
  cv_path: string | null;
  status: JobApplicationStatus;
  created_at: string;
  updated_at: string;
};

export type JobMessageRow = {
  id: string;
  application_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export const JOB_LISTING_COLUMNS =
  "id,poster_id,title,description,sector,location_area,salary_text,contact,mom_licence,image_paths,status,admin_note,report_count,featured_until,reviewed_by,reviewed_at,published_at,expires_at,created_at,updated_at";

export const JOB_APPLICATION_COLUMNS =
  "id,job_id,applicant_id,cover_note,cv_path,status,created_at,updated_at";

export const JOB_MESSAGE_COLUMNS =
  "id,application_id,sender_id,body,created_at";

export const JOB_LISTING_TTL_DAYS = 45;
export const JOB_FEATURED_DAYS = 14;
export const JOB_FEATURED_PRICE_SGD = 29;
export const JOB_FEATURED_PURPOSE = "job_featured";
export const MAX_JOB_IMAGES = 2;

/** Post quotas (DB-backed). */
export const JOB_POST_DAILY_LIMIT = 3;
export const JOB_POST_MONTHLY_LIMIT = 15;
export const JOB_ACTIVE_CONCURRENT_LIMIT = 5;

const JOB_IMAGE_BUCKET = "job-images";

export function jobImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${JOB_IMAGE_BUCKET}/${path}`;
}

export function jobImageUrls(paths: string[] | null | undefined): string[] {
  if (!paths?.length) return [];
  return paths
    .map((p) => jobImageUrl(p))
    .filter((u): u is string => Boolean(u));
}

export function expiresAtFromPublish(from = new Date()): string {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + JOB_LISTING_TTL_DAYS);
  return d.toISOString();
}

export function featuredUntilFromNow(from = new Date()): string {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + JOB_FEATURED_DAYS);
  return d.toISOString();
}

export function formatJobExpiry(
  expiresAt: string | null | undefined,
  locale: string,
): string | null {
  if (!expiresAt) return null;
  try {
    return new Date(expiresAt).toLocaleDateString(
      locale === "my" ? "en-SG" : locale,
      { dateStyle: "medium" },
    );
  } catch {
    return expiresAt.slice(0, 10);
  }
}

export function isJobFeatured(listing: Pick<JobListingRow, "featured_until">): boolean {
  if (!listing.featured_until) return false;
  return new Date(listing.featured_until).getTime() > Date.now();
}

/** Reject common fee-upfront scam phrasing in posts. */
export function looksLikeFeeUpfrontScam(text: string): boolean {
  return /(pay\s*(to\s*)?apply|application\s*fee|processing\s*fee|deposit\s*before|agent\s*fee\s*(required|must)|ငွေကြေးပေး|လျှောက်လွှာကြေး)/i.test(
    text,
  );
}
