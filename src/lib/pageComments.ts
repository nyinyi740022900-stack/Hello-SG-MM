import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { avatarUrl } from "@/lib/placeComments";
import {
  PAGE_DISCUSSION_LABELS,
  type PageDiscussionKey,
} from "@/lib/pageDiscussionKeys";

export type CommentAuthor = {
  display_name: string | null;
  avatar_url: string | null;
};

export type PageComment = {
  id: string;
  page_key: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  author: CommentAuthor;
  replies: PageComment[];
};

export type PageCommentReportReason =
  | "hate"
  | "inappropriate"
  | "spam"
  | "other";

export type AdminCommentReport = {
  id: string;
  reason: PageCommentReportReason;
  details: string | null;
  status: "pending" | "dismissed" | "resolved";
  created_at: string;
  comment: {
    id: string;
    page_key: string;
    page_label: string;
    body: string;
    is_visible: boolean;
    created_at: string;
    author_name: string | null;
  };
  reporter_name: string | null;
};

type CommentRow = {
  id: string;
  page_key: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  author_id: string;
  profiles: { display_name: string | null; avatar_path: string | null } | null;
};

const COMMENT_COLUMNS =
  "id,page_key,parent_id,body,created_at,author_id,profiles(display_name,avatar_path)";

function mapRow(row: CommentRow): Omit<PageComment, "replies"> {
  return {
    id: row.id,
    page_key: row.page_key,
    parent_id: row.parent_id,
    body: row.body,
    created_at: row.created_at,
    author: {
      display_name: row.profiles?.display_name ?? null,
      avatar_url: avatarUrl(row.profiles?.avatar_path),
    },
  };
}

/** Visible comments for one page, parents newest-first, replies oldest-first. */
export async function listPageComments(
  pageKey: PageDiscussionKey,
  limit = 80,
): Promise<{ data: PageComment[]; error: string | null }> {
  if (!supabase) return { data: [], error: null };

  const { data, error } = await supabase
    .from("page_comments")
    .select(COMMENT_COLUMNS)
    .eq("page_key", pageKey)
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<CommentRow[]>();

  if (error) return { data: [], error: error.message };

  const rows = (data ?? []).map(mapRow);
  const parents = rows.filter((r) => !r.parent_id);
  const byParent = new Map<string, PageComment[]>();

  for (const row of rows) {
    if (!row.parent_id) continue;
    const list = byParent.get(row.parent_id) ?? [];
    list.push({ ...row, replies: [] });
    byParent.set(row.parent_id, list);
  }

  for (const [, list] of byParent) {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  return {
    data: parents.map((p) => ({
      ...p,
      replies: byParent.get(p.id) ?? [],
    })),
    error: null,
  };
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Pending (+ recent) reports for admin moderation. */
export async function getAdminCommentReports(): Promise<AdminCommentReport[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data, error } = await db
    .from("page_comment_reports")
    .select(
      "id,reason,details,status,created_at,comment_id,reporter_id,page_comments(id,page_key,body,is_visible,created_at,author_id)",
    )
    .in("status", ["pending", "dismissed", "resolved"])
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[getAdminCommentReports]", error.message);
    return [];
  }

  type Raw = {
    id: string;
    reason: PageCommentReportReason;
    details: string | null;
    status: "pending" | "dismissed" | "resolved";
    created_at: string;
    reporter_id: string;
    page_comments: {
      id: string;
      page_key: string;
      body: string;
      is_visible: boolean;
      created_at: string;
      author_id: string;
    } | null;
  };

  const rows = (data ?? []) as unknown as Raw[];
  const profileIds = new Set<string>();
  for (const row of rows) {
    profileIds.add(row.reporter_id);
    if (row.page_comments?.author_id) profileIds.add(row.page_comments.author_id);
  }

  const names = new Map<string, string | null>();
  if (profileIds.size > 0) {
    const { data: profiles } = await db
      .from("profiles")
      .select("id,display_name")
      .in("id", [...profileIds]);
    for (const p of profiles ?? []) {
      names.set(
        (p as { id: string; display_name: string | null }).id,
        (p as { id: string; display_name: string | null }).display_name,
      );
    }
  }

  return rows
    .filter((row) => row.page_comments)
    .map((row) => {
      const comment = row.page_comments!;
      const pageKey = comment.page_key as PageDiscussionKey;
      return {
        id: row.id,
        reason: row.reason,
        details: row.details,
        status: row.status,
        created_at: row.created_at,
        comment: {
          id: comment.id,
          page_key: comment.page_key,
          page_label: PAGE_DISCUSSION_LABELS[pageKey] ?? comment.page_key,
          body: comment.body,
          is_visible: comment.is_visible,
          created_at: comment.created_at,
          author_name: names.get(comment.author_id) ?? null,
        },
        reporter_name: names.get(row.reporter_id) ?? null,
      };
    });
}
