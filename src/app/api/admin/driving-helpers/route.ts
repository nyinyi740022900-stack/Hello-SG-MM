import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { checkAdminAuth } from "@/lib/authz";
import { logServerEvent } from "@/lib/serverLogger";
import {
  DRIVING_HELPER_COLUMNS,
  validateOptionalHttpsUrl,
} from "@/lib/drivingHelpers";

export const dynamic = "force-dynamic";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  nameEn: z.string().trim().min(1).max(120),
  nameMy: z.string().trim().min(1).max(120),
  descriptionEn: z.string().trim().max(1000).optional().nullable(),
  descriptionMy: z.string().trim().max(1000).optional().nullable(),
  imagePath: z.string().trim().max(500).optional().nullable(),
  facebookUrl: z.string().trim().max(2000).optional().nullable(),
  telegramUrl: z.string().trim().max(2000).optional().nullable(),
  whatsappUrl: z.string().trim().max(2000).optional().nullable(),
  groupUrl: z.string().trim().max(2000).optional().nullable(),
  websiteUrl: z.string().trim().max(2000).optional().nullable(),
  isFree: z.boolean().default(true),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

function normalizeOptionalUrl(
  value: string | null | undefined,
): { ok: true; url: string | null } | { ok: false } {
  const result = validateOptionalHttpsUrl(value);
  if (result === false) return { ok: false };
  return { ok: true, url: result };
}

export async function GET(): Promise<NextResponse> {
  const auth = await checkAdminAuth();
  if (auth.status !== "authorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const db = serviceClient();
  if (!db) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const { data, error } = await db
    .from("driving_helpers")
    .select(DRIVING_HELPER_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    logServerEvent("error", "driving_helpers_list_failed", { message: error.message });
    return NextResponse.json({ error: "Could not load helpers." }, { status: 500 });
  }

  return NextResponse.json({ helpers: data ?? [] });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await checkAdminAuth();
  if (auth.status !== "authorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const db = serviceClient();
  if (!db) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = upsertSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the form fields and try again." }, { status: 400 });
  }

  const facebook = normalizeOptionalUrl(parsed.data.facebookUrl);
  const telegram = normalizeOptionalUrl(parsed.data.telegramUrl);
  const whatsapp = normalizeOptionalUrl(parsed.data.whatsappUrl);
  const group = normalizeOptionalUrl(parsed.data.groupUrl);
  const website = normalizeOptionalUrl(parsed.data.websiteUrl);

  if (!facebook.ok || !telegram.ok || !whatsapp.ok || !group.ok || !website.ok) {
    return NextResponse.json(
      { error: "Social and website links must be https:// URLs." },
      { status: 400 },
    );
  }

  const hasAnyLink =
    facebook.url || telegram.url || whatsapp.url || group.url || website.url;
  if (!hasAnyLink) {
    return NextResponse.json(
      { error: "Add at least one social, group, or website link." },
      { status: 400 },
    );
  }

  const row = {
    name_en: parsed.data.nameEn,
    name_my: parsed.data.nameMy,
    description_en: parsed.data.descriptionEn?.trim() || null,
    description_my: parsed.data.descriptionMy?.trim() || null,
    image_path: parsed.data.imagePath?.trim() || null,
    facebook_url: facebook.url,
    telegram_url: telegram.url,
    whatsapp_url: whatsapp.url,
    group_url: group.url,
    website_url: website.url,
    is_free: parsed.data.isFree,
    is_active: parsed.data.isActive,
    sort_order: parsed.data.sortOrder,
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.id) {
    const { data, error } = await db
      .from("driving_helpers")
      .update(row)
      .eq("id", parsed.data.id)
      .select(DRIVING_HELPER_COLUMNS)
      .single();

    if (error) {
      logServerEvent("error", "driving_helpers_update_failed", { message: error.message });
      return NextResponse.json({ error: "Could not save helper." }, { status: 500 });
    }

    return NextResponse.json({ helper: data });
  }

  const { data, error } = await db
    .from("driving_helpers")
    .insert({ ...row, created_by: auth.profile.id })
    .select(DRIVING_HELPER_COLUMNS)
    .single();

  if (error) {
    logServerEvent("error", "driving_helpers_insert_failed", { message: error.message });
    return NextResponse.json({ error: "Could not create helper." }, { status: 500 });
  }

  return NextResponse.json({ helper: data });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const auth = await checkAdminAuth();
  if (auth.status !== "authorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const db = serviceClient();
  if (!db) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Missing helper id." }, { status: 400 });
  }

  const { error } = await db.from("driving_helpers").delete().eq("id", id);
  if (error) {
    logServerEvent("error", "driving_helpers_delete_failed", { message: error.message });
    return NextResponse.json({ error: "Could not delete helper." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
