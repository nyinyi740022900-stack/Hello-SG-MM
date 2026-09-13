import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/authz";
import { checkRoomPostQuota } from "@/lib/listingQuotas.server";
import { logServerEvent } from "@/lib/serverLogger";
import { MAX_ROOM_IMAGES, ROOM_LISTING_COLUMNS } from "@/lib/roomListings";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().min(20).max(2000),
  area: z.string().trim().min(2).max(80),
  priceSgd: z.number().positive().max(20000),
  contact: z.string().trim().min(6).max(120),
  imagePaths: z.array(z.string().trim().min(1).max(500)).max(MAX_ROOM_IMAGES).default([]),
});

/** Authenticated user creates a pending room listing. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to post a room." }, { status: 401 });
  }

  const quota = await checkRoomPostQuota(user.id);
  if (!quota.ok) {
    return NextResponse.json(
      { error: quota.message, code: quota.code },
      { status: 429 },
    );
  }

  let parsed: z.infer<typeof postSchema>;
  try {
    const result = postSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid listing." },
        { status: 400 },
      );
    }
    parsed = result.data;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const blob = `${parsed.title} ${parsed.description} ${parsed.contact}`;
  if (/\b(FIN|NRIC|passport)\b/i.test(blob) && /\d{3}[A-Za-z]?\b/.test(blob)) {
    return NextResponse.json(
      { error: "Do not include passport, FIN or NRIC numbers." },
      { status: 400 },
    );
  }

  for (const path of parsed.imagePaths) {
    if (!path.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: "Invalid photo path." }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("room_listings")
    .insert({
      poster_id: user.id,
      title: parsed.title,
      description: parsed.description,
      area: parsed.area,
      price_sgd: parsed.priceSgd,
      contact: parsed.contact,
      image_paths: parsed.imagePaths,
      status: "pending",
    })
    .select(ROOM_LISTING_COLUMNS)
    .single();

  if (error) {
    logServerEvent("error", "room_listing_create_failed", { message: error.message });
    return NextResponse.json({ error: "Could not save listing." }, { status: 500 });
  }

  return NextResponse.json({ listing: data }, { status: 201 });
}

/** Poster delists their own room, published or not. Admin-only otherwise. */
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
    return NextResponse.json({ error: "Missing listing id." }, { status: 400 });
  }

  // No ownership check here on purpose: the delete policy already restricts
  // this to the row's own poster, so a request for someone else's listing
  // deletes nothing rather than confirming the listing exists.
  const { error } = await supabase.from("room_listings").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Could not remove the listing." }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
