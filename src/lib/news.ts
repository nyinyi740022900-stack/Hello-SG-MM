import { supabase } from "@/lib/supabase";

export type NewsCategory = "mom_policy" | "exchange_rate" | "safety_scam" | "community";
export type NewsStatus = "pending" | "published" | "rejected";

export type NewsItem = {
  id: string;
  category: NewsCategory;
  title_en: string;
  title_my: string;
  body_en: string;
  body_my: string;
  source_url: string | null;
  status: NewsStatus;
  created_by: string;
  published_at: string | null;
  created_at: string;
};

const NEWS_COLUMNS =
  "id,category,title_en,title_my,body_en,body_my,source_url,status,created_by,published_at,created_at";

/** Public feed — published items only. Safe to call without auth. */
export async function listPublishedNews(
  limit = 30,
): Promise<{ data: NewsItem[] | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("news_items")
    .select(NEWS_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit)
    .returns<NewsItem[]>();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data ?? [], error: null };
}

/** Admin-only — pending items awaiting review. */
export async function listPendingNews(): Promise<{ data: NewsItem[] | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("news_items")
    .select(NEWS_COLUMNS)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .returns<NewsItem[]>();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: data ?? [], error: null };
}

export async function approveNewsItem(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase
    .from("news_items")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function rejectNewsItem(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("news_items").update({ status: "rejected" }).eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteNewsItem(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("news_items").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export type ManualNewsInput = {
  category: NewsCategory;
  titleEn: string;
  titleMy: string;
  bodyEn: string;
  bodyMy: string;
  sourceUrl?: string;
};

/** Admin manual post — publishes immediately (admin already trusts their own input). */
export async function createManualNewsItem(
  input: ManualNewsInput,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("news_items").insert({
    category: input.category,
    title_en: input.titleEn,
    title_my: input.titleMy,
    body_en: input.bodyEn,
    body_my: input.bodyMy,
    source_url: input.sourceUrl?.trim() || null,
    status: "published",
    created_by: "admin",
    published_at: new Date().toISOString(),
  });
  return { error: error?.message ?? null };
}
