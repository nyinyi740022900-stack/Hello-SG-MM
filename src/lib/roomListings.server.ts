import { createClient } from "@supabase/supabase-js";
import {
  ROOM_LISTING_COLUMNS,
  type RoomListingRow,
  type RoomListingStatus,
} from "@/lib/roomListings";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function anonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Published, non-expired listings for the public board. */
export async function listPublishedRoomListings(
  limit = 40,
): Promise<RoomListingRow[]> {
  const db = anonClient();
  if (!db) return [];

  const nowIso = new Date().toISOString();
  const { data, error } = await db
    .from("room_listings")
    .select(ROOM_LISTING_COLUMNS)
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("published_at", { ascending: false })
    .limit(limit)
    .returns<RoomListingRow[]>();

  if (error) {
    console.error("[listPublishedRoomListings]", error.message);
    return [];
  }
  return data ?? [];
}

export async function getPublishedRoomListing(
  id: string,
): Promise<RoomListingRow | null> {
  const db = anonClient();
  if (!db) return null;

  const nowIso = new Date().toISOString();
  const { data, error } = await db
    .from("room_listings")
    .select(ROOM_LISTING_COLUMNS)
    .eq("id", id)
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .maybeSingle();

  if (error) {
    console.error("[getPublishedRoomListing]", error.message);
    return null;
  }
  return (data as RoomListingRow | null) ?? null;
}

/** Admin queue — all statuses, newest first. */
export async function listAdminRoomListings(
  status?: RoomListingStatus,
): Promise<RoomListingRow[]> {
  const db = serviceClient();
  if (!db) return [];

  let query = db
    .from("room_listings")
    .select(ROOM_LISTING_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("status", status);

  const { data, error } = await query.returns<RoomListingRow[]>();
  if (error) {
    console.error("[listAdminRoomListings]", error.message);
    return [];
  }
  return data ?? [];
}

/** Rooms posted by this user (any status) — Account “My rooms”. */
export async function listRoomsForPoster(
  posterId: string,
): Promise<RoomListingRow[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data, error } = await db
    .from("room_listings")
    .select(ROOM_LISTING_COLUMNS)
    .eq("poster_id", posterId)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<RoomListingRow[]>();

  if (error) {
    console.error("[listRoomsForPoster]", error.message);
    return [];
  }
  return data ?? [];
}
