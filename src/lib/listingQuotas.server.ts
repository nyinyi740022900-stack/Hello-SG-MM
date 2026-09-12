import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  JOB_ACTIVE_CONCURRENT_LIMIT,
  JOB_POST_DAILY_LIMIT,
  JOB_POST_MONTHLY_LIMIT,
} from "@/lib/jobListings";
import {
  ROOM_ACTIVE_CONCURRENT_LIMIT,
  ROOM_POST_DAILY_LIMIT,
  ROOM_POST_MONTHLY_LIMIT,
} from "@/lib/roomListings";

function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function startOfUtcDay(now = new Date()): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

function startOfUtcMonth(now = new Date()): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();
}

async function countRows(
  db: SupabaseClient,
  table: "room_listings" | "job_listings",
  posterId: string,
  filters: { since?: string; statuses?: string[] },
): Promise<number> {
  let query = db
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("poster_id", posterId);

  if (filters.since) {
    query = query.gte("created_at", filters.since);
  }
  if (filters.statuses?.length) {
    query = query.in("status", filters.statuses);
  }

  const { count, error } = await query;
  if (error) {
    console.error(`[countRows:${table}]`, error.message);
    return Number.POSITIVE_INFINITY; // fail closed
  }
  return count ?? 0;
}

export type ListingPostQuotaResult =
  | { ok: true }
  | { ok: false; code: "daily" | "monthly" | "concurrent"; message: string };

/**
 * Enforce daily / monthly / concurrent caps before creating a room listing.
 */
export async function checkRoomPostQuota(
  posterId: string,
): Promise<ListingPostQuotaResult> {
  const db = serviceClient();
  if (!db) {
    return { ok: false, code: "daily", message: "Server not configured." };
  }

  const [dayCount, monthCount, activeCount] = await Promise.all([
    countRows(db, "room_listings", posterId, { since: startOfUtcDay() }),
    countRows(db, "room_listings", posterId, { since: startOfUtcMonth() }),
    countRows(db, "room_listings", posterId, {
      statuses: ["pending", "published"],
    }),
  ]);

  if (dayCount >= ROOM_POST_DAILY_LIMIT) {
    return {
      ok: false,
      code: "daily",
      message: `Daily room limit reached (${ROOM_POST_DAILY_LIMIT} per day). Try again tomorrow.`,
    };
  }
  if (monthCount >= ROOM_POST_MONTHLY_LIMIT) {
    return {
      ok: false,
      code: "monthly",
      message: `Monthly room limit reached (${ROOM_POST_MONTHLY_LIMIT} this month). Try again next month.`,
    };
  }
  if (activeCount >= ROOM_ACTIVE_CONCURRENT_LIMIT) {
    return {
      ok: false,
      code: "concurrent",
      message: `You already have ${ROOM_ACTIVE_CONCURRENT_LIMIT} active room listings (pending or published). Wait until one expires or is rejected.`,
    };
  }

  return { ok: true };
}

/**
 * Enforce daily / monthly / concurrent caps before creating a job listing.
 */
export async function checkJobPostQuota(
  posterId: string,
): Promise<ListingPostQuotaResult> {
  const db = serviceClient();
  if (!db) {
    return { ok: false, code: "daily", message: "Server not configured." };
  }

  const [dayCount, monthCount, activeCount] = await Promise.all([
    countRows(db, "job_listings", posterId, { since: startOfUtcDay() }),
    countRows(db, "job_listings", posterId, { since: startOfUtcMonth() }),
    countRows(db, "job_listings", posterId, {
      statuses: ["pending", "published"],
    }),
  ]);

  if (dayCount >= JOB_POST_DAILY_LIMIT) {
    return {
      ok: false,
      code: "daily",
      message: `Daily job limit reached (${JOB_POST_DAILY_LIMIT} per day). Try again tomorrow.`,
    };
  }
  if (monthCount >= JOB_POST_MONTHLY_LIMIT) {
    return {
      ok: false,
      code: "monthly",
      message: `Monthly job limit reached (${JOB_POST_MONTHLY_LIMIT} this month). Try again next month.`,
    };
  }
  if (activeCount >= JOB_ACTIVE_CONCURRENT_LIMIT) {
    return {
      ok: false,
      code: "concurrent",
      message: `You already have ${JOB_ACTIVE_CONCURRENT_LIMIT} active job listings (pending or published). Wait until one expires or is rejected.`,
    };
  }

  return { ok: true };
}

/** Mark published listings past expires_at as expired. */
export async function expireStaleListings(): Promise<{
  rooms: number;
  jobs: number;
  error: string | null;
}> {
  const db = serviceClient();
  if (!db) return { rooms: 0, jobs: 0, error: "Server not configured." };

  const nowIso = new Date().toISOString();

  const [roomsRes, jobsRes] = await Promise.all([
    db
      .from("room_listings")
      .update({ status: "expired" })
      .eq("status", "published")
      .lt("expires_at", nowIso)
      .select("id"),
    db
      .from("job_listings")
      .update({ status: "expired" })
      .eq("status", "published")
      .lt("expires_at", nowIso)
      .select("id"),
  ]);

  if (roomsRes.error || jobsRes.error) {
    return {
      rooms: roomsRes.data?.length ?? 0,
      jobs: jobsRes.data?.length ?? 0,
      error: roomsRes.error?.message ?? jobsRes.error?.message ?? "Update failed.",
    };
  }

  return {
    rooms: roomsRes.data?.length ?? 0,
    jobs: jobsRes.data?.length ?? 0,
    error: null,
  };
}
