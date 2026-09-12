import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/authz";
import { consumeRateLimit } from "@/lib/rateLimit";
import { logServerEvent } from "@/lib/serverLogger";

export const dynamic = "force-dynamic";

const reportSchema = z.object({
  commentId: z.string().uuid(),
  reason: z.enum(["hate", "inappropriate", "spam", "other"]),
  details: z.string().trim().max(400).optional().nullable(),
});

/** Signed-in users report a page comment for admin review. */
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
    key: `page-comment-report:${user.id}`,
    limit: 15,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many reports. Try again later." },
      { status: 429 },
    );
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

  const { data: comment } = await supabase
    .from("page_comments")
    .select("id,author_id,is_visible")
    .eq("id", parsed.commentId)
    .maybeSingle();

  if (!comment || !comment.is_visible) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }
  if (comment.author_id === user.id) {
    return NextResponse.json(
      { error: "You cannot report your own comment." },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("page_comment_reports").insert({
    comment_id: parsed.commentId,
    reporter_id: user.id,
    reason: parsed.reason,
    details: parsed.details?.trim() || null,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You already reported this comment." },
        { status: 409 },
      );
    }
    logServerEvent("error", "page_comment_report_failed", { message: error.message });
    return NextResponse.json({ error: "Could not save report." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
