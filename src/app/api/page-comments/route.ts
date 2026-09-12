import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/authz";
import { consumeRateLimit } from "@/lib/rateLimit";
import { logServerEvent } from "@/lib/serverLogger";
import { isPageDiscussionKey } from "@/lib/pageDiscussionKeys";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  pageKey: z.string().min(1).max(80),
  body: z.string().trim().min(1).max(800),
  parentId: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });
  }

  const limit = consumeRateLimit({
    key: `page-comment:${user.id}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You have posted a lot just now. Try again later." },
      { status: 429 },
    );
  }

  let parsed: z.infer<typeof postSchema>;
  try {
    const result = postSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json({ error: "Invalid comment." }, { status: 400 });
    }
    parsed = result.data;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!isPageDiscussionKey(parsed.pageKey)) {
    return NextResponse.json({ error: "Unknown page." }, { status: 400 });
  }

  let parentId: string | null = parsed.parentId ?? null;
  if (parentId) {
    const { data: parent, error: parentError } = await supabase
      .from("page_comments")
      .select("id,page_key,parent_id,is_visible")
      .eq("id", parentId)
      .maybeSingle();

    if (parentError || !parent || !parent.is_visible) {
      return NextResponse.json({ error: "Parent comment not found." }, { status: 400 });
    }
    if (parent.page_key !== parsed.pageKey) {
      return NextResponse.json({ error: "Invalid reply." }, { status: 400 });
    }
    // One-level only: replies cannot have replies.
    if (parent.parent_id) {
      return NextResponse.json(
        { error: "Reply only to the main comment." },
        { status: 400 },
      );
    }
  }

  const { error } = await supabase.from("page_comments").insert({
    page_key: parsed.pageKey,
    author_id: user.id,
    body: parsed.body,
    parent_id: parentId,
  });

  if (error) {
    logServerEvent("error", "page_comment_insert_failed", { message: error.message });
    return NextResponse.json({ error: "Could not save your comment." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  const { error } = await supabase.from("page_comments").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Could not remove the comment." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
