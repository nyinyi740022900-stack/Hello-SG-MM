import { supabase } from "@/lib/supabase";

/**
 * Comments under an off-day place.
 *
 * What a comment may say about its author is deliberately thin: a name and an
 * avatar, nothing that helps a stranger find them. See the migration for why
 * this app does not carry meetups, locations or private messages.
 */

export type PlaceComment = {
  id: string;
  place_key: string;
  parent_id: string | null;
  author_id: string;
  body: string;
  created_at: string;
  author: {
    display_name: string | null;
    avatar_url: string | null;
  };
  /** One level only — a reply's own `replies` is always empty. */
  replies: PlaceComment[];
};

type CommentRow = {
  id: string;
  place_key: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  author_id: string;
  profiles: { display_name: string | null; avatar_path: string | null } | null;
};

const COMMENT_COLUMNS =
  "id,place_key,parent_id,body,created_at,author_id,profiles(display_name,avatar_path)";

/** Public URL for an avatar stored in the `avatars` bucket. */
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/avatars/${path}`;
}

/**
 * Comments for one place, newest first.
 *
 * Expiry is enforced by the row-level policy rather than repeated here, so a
 * comment that has aged out cannot be read back by any path — including a
 * future caller that forgets to filter.
 */
export async function listPlaceComments(
  placeKey: string,
  limit = 30,
): Promise<{ data: PlaceComment[]; error: string | null }> {
  if (!supabase) return { data: [], error: null };

  const { data, error } = await supabase
    .from("place_comments")
    .select(COMMENT_COLUMNS)
    .eq("place_key", placeKey)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<CommentRow[]>();

  if (error) return { data: [], error: error.message };

  const toComment = (row: CommentRow): PlaceComment => ({
    id: row.id,
    place_key: row.place_key,
    parent_id: row.parent_id,
    author_id: row.author_id,
    body: row.body,
    created_at: row.created_at,
    author: {
      display_name: row.profiles?.display_name ?? null,
      avatar_url: avatarUrl(row.profiles?.avatar_path),
    },
    replies: [],
  });

  const rows = data ?? [];
  const parents = rows.filter((row) => !row.parent_id).map(toComment);

  const repliesByParent = new Map<string, PlaceComment[]>();
  for (const row of rows) {
    if (!row.parent_id) continue;
    const list = repliesByParent.get(row.parent_id) ?? [];
    list.push(toComment(row));
    repliesByParent.set(row.parent_id, list);
  }

  for (const parent of parents) {
    // Oldest first within a thread, same as page_comments.
    parent.replies = (repliesByParent.get(parent.id) ?? []).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }

  return { data: parents, error: null };
}

/** Comment counts for many places in one query, for the list view. */
export async function countCommentsByPlace(
  placeKeys: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!supabase || placeKeys.length === 0) return counts;

  const { data, error } = await supabase
    .from("place_comments")
    .select("place_key")
    .in("place_key", placeKeys)
    .returns<{ place_key: string }[]>();

  if (error) return counts;

  for (const row of data ?? []) {
    counts.set(row.place_key, (counts.get(row.place_key) ?? 0) + 1);
  }
  return counts;
}

/** Initials for a reader with no avatar — never more than two letters. */
export function initialsFor(displayName: string | null): string {
  const name = displayName?.trim();
  if (!name) return "?";
  const parts = name.split(/\s+/).slice(0, 2);
  return parts.map((p) => [...p][0] ?? "").join("").toUpperCase() || "?";
}
