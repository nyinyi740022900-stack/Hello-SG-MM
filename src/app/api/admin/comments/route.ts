import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { checkAdminAuth } from "@/lib/authz";
import { logServerEvent } from "@/lib/serverLogger";

export const dynamic = "force-dynamic";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("dismiss"),
    reportId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("delete_comment"),
    commentId: z.string().uuid(),
    reportId: z.string().uuid().optional(),
  }),
]);

/** Admin: dismiss a report or hide (soft-delete) a comment. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await checkAdminAuth();
  if (auth.status !== "authorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const db = serviceClient();
  if (!db) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  let parsed: z.infer<typeof actionSchema>;
  try {
    const result = actionSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }
    parsed = result.data;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const now = new Date().toISOString();

  if (parsed.action === "dismiss") {
    const { error } = await db
      .from("page_comment_reports")
      .update({
        status: "dismissed",
        reviewed_by: auth.profile.id,
        reviewed_at: now,
      })
      .eq("id", parsed.reportId);

    if (error) {
      logServerEvent("error", "page_comment_report_dismiss_failed", {
        message: error.message,
      });
      return NextResponse.json({ error: "Could not dismiss report." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // Soft-hide comment so it disappears publicly but stays for audit.
  const { error: hideError } = await db
    .from("page_comments")
    .update({ is_visible: false })
    .eq("id", parsed.commentId);

  if (hideError) {
    logServerEvent("error", "page_comment_hide_failed", { message: hideError.message });
    return NextResponse.json({ error: "Could not delete comment." }, { status: 500 });
  }

  // Mark related reports resolved (specific report or all for this comment).
  let resolveQuery = db
    .from("page_comment_reports")
    .update({
      status: "resolved",
      reviewed_by: auth.profile.id,
      reviewed_at: now,
    })
    .eq("comment_id", parsed.commentId)
    .eq("status", "pending");

  if (parsed.reportId) {
    resolveQuery = db
      .from("page_comment_reports")
      .update({
        status: "resolved",
        reviewed_by: auth.profile.id,
        reviewed_at: now,
      })
      .eq("id", parsed.reportId);
  }

  const { error: reportError } = await resolveQuery;
  if (reportError) {
    logServerEvent("error", "page_comment_report_resolve_failed", {
      message: reportError.message,
    });
  }

  return NextResponse.json({ ok: true });
}
