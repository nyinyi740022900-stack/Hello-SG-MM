import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { checkAdminAuth } from "@/lib/authz";
import { expiresAtFromPublish, ROOM_LISTING_COLUMNS } from "@/lib/roomListings";
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
    action: z.literal("approve"),
    id: z.string().uuid(),
    adminNote: z.string().trim().max(500).optional().nullable(),
  }),
  z.object({
    action: z.literal("reject"),
    id: z.string().uuid(),
    adminNote: z.string().trim().min(2).max(500),
  }),
  z.object({
    action: z.literal("expire"),
    id: z.string().uuid(),
  }),
  z.object({
    action: z.literal("delete"),
    id: z.string().uuid(),
  }),
]);

/** Admin moderation for room listings. */
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
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 },
      );
    }
    parsed = result.data;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (parsed.action === "delete") {
    const { error } = await db.from("room_listings").delete().eq("id", parsed.id);
    if (error) {
      logServerEvent("error", "room_listing_admin_delete_failed", {
        message: error.message,
      });
      return NextResponse.json({ error: "Delete failed." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  const nowIso = new Date().toISOString();
  const patch =
    parsed.action === "approve"
      ? {
          status: "published" as const,
          admin_note: parsed.adminNote?.trim() || null,
          reviewed_by: auth.profile.id,
          reviewed_at: nowIso,
          published_at: nowIso,
          expires_at: expiresAtFromPublish(),
        }
      : parsed.action === "reject"
        ? {
            status: "rejected" as const,
            admin_note: parsed.adminNote.trim(),
            reviewed_by: auth.profile.id,
            reviewed_at: nowIso,
          }
        : {
            status: "expired" as const,
            reviewed_by: auth.profile.id,
            reviewed_at: nowIso,
          };

  const { data, error } = await db
    .from("room_listings")
    .update(patch)
    .eq("id", parsed.id)
    .select(ROOM_LISTING_COLUMNS)
    .maybeSingle();

  if (error) {
    logServerEvent("error", "room_listing_admin_update_failed", {
      message: error.message,
    });
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  return NextResponse.json({ listing: data });
}
