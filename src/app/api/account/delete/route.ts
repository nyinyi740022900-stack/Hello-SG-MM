import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createServerSupabaseClient, getUserProfileById } from "@/lib/authz";
import { logServerEvent } from "@/lib/serverLogger";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  confirm: z.literal("DELETE"),
});

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Permanently deletes the authenticated user's auth account.
 * Cascades profiles / drafts / comments via FK ON DELETE CASCADE.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Type DELETE to confirm account deletion.' },
      { status: 400 },
    );
  }

  const profile = await getUserProfileById(user.id);
  if (profile?.role === "admin") {
    return NextResponse.json(
      {
        error:
          "Admin accounts cannot be self-deleted here. Contact another admin or support.",
      },
      { status: 403 },
    );
  }

  const db = serviceClient();
  if (!db) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) {
    logServerEvent("error", "account_delete_failed", { message: error.message });
    return NextResponse.json(
      { error: "Could not delete account. Please try again or contact support." },
      { status: 500 },
    );
  }

  logServerEvent("info", "account_deleted", { userId: user.id });
  return NextResponse.json({ ok: true });
}
