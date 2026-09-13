import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/authz";
import { consumeRateLimit } from "@/lib/rateLimit";
import { logServerEvent } from "@/lib/serverLogger";
import { OFF_DAY_PLACES } from "@/lib/offDayPlaces";

/**
 * Posting and removing a comment on an off-day place.
 *
 * Signed-in only, unlike the anonymous translation-report route: that one is
 * private and advisory, while this one publishes text under someone's name to
 * every other reader. Requiring an account is the smallest barrier that makes
 * a comment attributable and removable.
 *
 * The write itself goes through the caller's own session, not the service
 * role, so the row-level policies are what actually enforce "only as
 * yourself" — this route cannot be tricked into writing as another user even
 * if the body says otherwise.
 */

const PLACE_KEYS = new Set(OFF_DAY_PLACES.map((p) => p.key));

const commentSchema = z.object({
  placeKey: z.string().min(1).max(60),
  body: z.string().trim().min(1).max(500),
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

  // Per account, not per IP: shared dormitory wifi means one IP can be a
  // hundred readers, and rate limiting them as one would silence a building.
  const limit = consumeRateLimit({
    key: `place-comment:${user.id}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "You have posted a lot just now. Try again later." },
      { status: 429 },
    );
  }

  let parsed: z.infer<typeof commentSchema>;
  try {
    const result = commentSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json({ error: "Invalid comment." }, { status: 400 });
    }
    parsed = result.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Places live in code, so an unknown key is a bad request rather than a row
  // nobody will ever read.
  if (!PLACE_KEYS.has(parsed.placeKey)) {
    return NextResponse.json({ error: "Unknown place." }, { status: 400 });
  }

  // A reply must point at a live, top-level comment on the same place. This
  // keeps threading to one level, the same restriction page_comments applies,
  // so a reply can never itself gain replies.
  if (parsed.parentId) {
    const { data: parent } = await supabase
      .from("place_comments")
      .select("id,place_key,parent_id,is_visible")
      .eq("id", parsed.parentId)
      .maybeSingle();

    if (
      !parent ||
      !parent.is_visible ||
      parent.place_key !== parsed.placeKey ||
      parent.parent_id !== null
    ) {
      return NextResponse.json({ error: "Reply only to the main comment." }, { status: 400 });
    }
  }

  const { error } = await supabase.from("place_comments").insert({
    place_key: parsed.placeKey,
    author_id: user.id,
    body: parsed.body,
    parent_id: parsed.parentId ?? null,
  });

  if (error) {
    logServerEvent("error", "place_comment_insert_failed", { reason: error.message });
    return NextResponse.json({ error: "Could not save your comment." }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
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

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing comment id." }, { status: 400 });
  }

  // No author check here on purpose: the delete policy already restricts this
  // to the row's own author, so a request for someone else's comment deletes
  // nothing rather than being rejected with a message that confirms the
  // comment exists.
  const { error } = await supabase.from("place_comments").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Could not remove the comment." }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
