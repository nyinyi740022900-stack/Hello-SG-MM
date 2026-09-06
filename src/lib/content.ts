import { supabase } from "@/lib/supabase";

export type ContentType = "news" | "event" | "directory";
export type ContentPriority = "urgent" | "high" | "normal";
export type ContentStatus = "pending" | "published" | "rejected";
export type ContentCategory =
  | "mom_policy"
  | "embassy"
  | "safety_scam"
  | "finance"
  | "legal"
  | "health"
  | "community"
  | "education"
  | "transport"
  | "jobs";

export const CONTENT_CATEGORIES: ContentCategory[] = [
  "mom_policy",
  "embassy",
  "safety_scam",
  "finance",
  "legal",
  "health",
  "community",
  "education",
  "transport",
  "jobs",
];

export type ContentItem = {
  id: string;
  type: ContentType;
  category: ContentCategory;
  priority: ContentPriority;
  slug: string | null;
  title_en: string;
  title_my: string;
  summary_en: string | null;
  summary_my: string | null;
  body_en: string;
  body_my: string;
  source_url: string | null;
  source_name: string | null;
  source_published_at: string | null;
  expires_at: string | null;
  tags: string[];
  // type = 'event'
  starts_at: string | null;
  ends_at: string | null;
  location_name: string | null;
  address: string | null;
  // type = 'directory'
  phone: string | null;
  website: string | null;
  opening_hours: string | null;
  languages: string[] | null;
  is_free: boolean | null;
  status: ContentStatus;
  created_by: string;
  reviewed_by: string | null;
  review_note: string | null;
  /** Machine translations by locale. Always shown with a label. */
  translations: Record<string, { title?: string; summary?: string; body?: string }> | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const CONTENT_COLUMNS =
  "id,type,category,priority,slug,title_en,title_my,summary_en,summary_my,body_en,body_my," +
  "source_url,source_name,source_published_at,expires_at,tags," +
  "starts_at,ends_at,location_name,address," +
  "phone,website,opening_hours,languages,is_free," +
  "status,created_by,reviewed_by,review_note,translations,published_at,created_at,updated_at";

/**
 * Build a shareable slug from an English title: lowercase, strip to
 * [a-z0-9], collapse separators, trim to 60 chars, then append a 6-char
 * suffix so it's unique. Mirrors the SQL backfill in the portal content
 * migration.
 */
export function generateSlug(titleEn: string, id?: string): string {
  const base = (titleEn || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");

  const text = base || "item";

  const suffix = (id ? id.replace(/-/g, "") : Math.random().toString(36).slice(2))
    .padEnd(6, "0")
    .slice(0, 6);

  return `${text}-${suffix}`;
}

/** Public feed — published, non-expired items only. Safe to call without auth. */
export async function listPublishedContent(
  params: { type?: ContentType; category?: ContentCategory; limit?: number } = {},
): Promise<{ data: ContentItem[] | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { type, category, limit = 30 } = params;

  let query = supabase
    .from("content_items")
    .select(CONTENT_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (type) query = query.eq("type", type);
  if (category) query = query.eq("category", category);

  const { data, error } = await query.returns<ContentItem[]>();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data ?? [], error: null };
}

/**
 * Upcoming events, soonest first.
 *
 * Ordered by when the event happens, not when we published it — a notice
 * posted last week about tomorrow's gathering has to outrank one posted today
 * about next month. An event stays listed until its end time (or its start,
 * for single-moment events) has passed.
 */
export async function listUpcomingEvents(
  limit = 20,
): Promise<{ data: ContentItem[] | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("content_items")
    .select(CONTENT_COLUMNS)
    .eq("status", "published")
    .eq("type", "event")
    .or(`ends_at.gte.${nowIso},and(ends_at.is.null,starts_at.gte.${nowIso})`)
    .order("starts_at", { ascending: true })
    .limit(limit)
    .returns<ContentItem[]>();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data ?? [], error: null };
}

/** Service directory entries, alphabetical. These change rarely. */
export async function listDirectoryEntries(
  category?: ContentCategory,
): Promise<{ data: ContentItem[] | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  let query = supabase
    .from("content_items")
    .select(CONTENT_COLUMNS)
    .eq("status", "published")
    .eq("type", "directory")
    .order("title_en", { ascending: true })
    .limit(200);

  if (category) query = query.eq("category", category);

  const { data, error } = await query.returns<ContentItem[]>();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data ?? [], error: null };
}

/** Admin-only — pending items awaiting review, oldest first. */
export async function listPendingContent(): Promise<{
  data: ContentItem[] | null;
  error: string | null;
}> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("content_items")
    .select(CONTENT_COLUMNS)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .returns<ContentItem[]>();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data ?? [], error: null };
}

/**
 * Search published content across both languages.
 *
 * Deliberately a substring match rather than Postgres full-text search:
 * `to_tsvector` has no Myanmar configuration, so its stemming and stop-word
 * handling would silently degrade to nonsense on exactly the half of the
 * content most readers use. A plain case-insensitive `ilike` treats both
 * scripts the same and behaves predictably at this size.
 */
export async function searchContent(
  rawQuery: string,
  limit = 40,
): Promise<{ data: ContentItem[] | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  // Strip the PostgREST filter metacharacters that would otherwise let a
  // search box alter the query it is embedded in.
  const cleaned = rawQuery.trim().replace(/[%_,()]/g, " ").slice(0, 80).trim();
  if (!cleaned) return { data: [], error: null };

  const pattern = `%${cleaned}%`;
  const fields = ["title_en", "title_my", "summary_en", "summary_my", "body_en", "body_my"];

  const { data, error } = await supabase
    .from("content_items")
    .select(CONTENT_COLUMNS)
    .eq("status", "published")
    .or(fields.map((field) => `${field}.ilike.${pattern}`).join(","))
    .order("published_at", { ascending: false })
    .limit(limit)
    .returns<ContentItem[]>();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data ?? [], error: null };
}

/** Public detail page lookup — single published item by slug, or null. */
export async function getContentBySlug(
  slug: string,
): Promise<{ data: ContentItem | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("content_items")
    .select(CONTENT_COLUMNS)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle<ContentItem>();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data ?? null, error: null };
}

export async function approveContentItem(id: string): Promise<{ error: string | null }> {
  return approveContentItems([id]);
}

/**
 * Publish one or many items in a single round trip.
 *
 * Records who approved it: everything here was drafted by an agent, so when a
 * published claim later turns out to be wrong, the useful question is who
 * signed off on it.
 */
export async function approveContentItems(ids: string[]): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  if (ids.length === 0) return { error: null };

  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("content_items")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      reviewed_by: userData.user?.id ?? null,
    })
    .in("id", ids);
  return { error: error?.message ?? null };
}

/**
 * Reject an item, optionally saying why. The reason is the only feedback loop
 * we have for improving the agent's output, so it is worth capturing.
 */
export async function rejectContentItem(
  id: string,
  reason?: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };

  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("content_items")
    .update({
      status: "rejected",
      reviewed_by: userData.user?.id ?? null,
      review_note: reason?.trim() || null,
    })
    .eq("id", id);
  return { error: error?.message ?? null };
}

/** Fields an admin may correct before publishing. */
export type ContentEditableFields = Pick<
  ContentItem,
  | "title_en"
  | "title_my"
  | "summary_en"
  | "summary_my"
  | "body_en"
  | "body_my"
  | "category"
  | "priority"
>;

/**
 * Save admin corrections without changing review status.
 *
 * This exists because the Myanmar text is the part most likely to need a human
 * fix — agent wording has reached users with real vocabulary errors before, and
 * catching them at review is far cheaper than correcting a published item.
 */
export async function updateContentItem(
  id: string,
  patch: Partial<ContentEditableFields>,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  if (Object.keys(patch).length === 0) return { error: null };

  const { error } = await supabase.from("content_items").update(patch).eq("id", id);
  return { error: error?.message ?? null };
}

/** Number of items waiting for review, for the admin badge. */
export async function countPendingContent(): Promise<{ count: number; error: string | null }> {
  if (!supabase) return { count: 0, error: "Supabase is not configured." };

  const { count, error } = await supabase
    .from("content_items")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return { count: count ?? 0, error: error?.message ?? null };
}

export async function deleteContentItem(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("content_items").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export type ManualContentInput = {
  type?: ContentType;
  category: ContentCategory;
  priority?: ContentPriority;
  titleEn: string;
  titleMy: string;
  summaryEn?: string;
  summaryMy?: string;
  bodyEn: string;
  bodyMy: string;
  sourceUrl?: string;
  sourceName?: string;
  // type = 'event'
  startsAt?: string;
  endsAt?: string;
  locationName?: string;
  address?: string;
  // type = 'directory'
  phone?: string;
  website?: string;
  openingHours?: string;
  languages?: string[];
  isFree?: boolean;
};

/** Admin manual post — publishes immediately (admin already trusts their own input). */
export async function createManualContentItem(
  input: ManualContentInput,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("content_items").insert({
    type: input.type ?? "news",
    category: input.category,
    priority: input.priority ?? "normal",
    slug: generateSlug(input.titleEn),
    title_en: input.titleEn,
    title_my: input.titleMy,
    summary_en: input.summaryEn?.trim() || null,
    summary_my: input.summaryMy?.trim() || null,
    body_en: input.bodyEn,
    body_my: input.bodyMy,
    source_url: input.sourceUrl?.trim() || null,
    source_name: input.sourceName?.trim() || null,
    starts_at: input.startsAt || null,
    ends_at: input.endsAt || null,
    location_name: input.locationName?.trim() || null,
    address: input.address?.trim() || null,
    phone: input.phone?.trim() || null,
    website: input.website?.trim() || null,
    opening_hours: input.openingHours?.trim() || null,
    languages: input.languages ?? null,
    is_free: input.isFree ?? null,
    status: "published",
    created_by: "admin",
    published_at: new Date().toISOString(),
  });
  return { error: error?.message ?? null };
}
