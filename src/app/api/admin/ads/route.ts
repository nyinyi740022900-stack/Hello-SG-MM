import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { checkAdminAuth } from "@/lib/authz";
import { logServerEvent } from "@/lib/serverLogger";
import { AD_PLACEMENTS, SPONSORED_AD_COLUMNS } from "@/lib/sponsoredAds";

export const dynamic = "force-dynamic";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  sponsorName: z.string().trim().min(1).max(120).default("Partner"),
  ctaLabel: z.string().trim().min(1).max(60).default("Learn More"),
  targetUrl: z.string().trim().min(1).max(2000),
  imagePath: z.string().trim().max(500).optional().nullable(),
  placement: z.enum(AD_PLACEMENTS),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

function validateTargetUrl(url: string): string | null {
  const trimmed = url.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:") return parsed.toString();
    if (parsed.protocol === "http:" && parsed.hostname === "localhost") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
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
    .from("sponsored_ads")
    .select(SPONSORED_AD_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    logServerEvent("error", "sponsored_ads_list_failed", { message: error.message });
    return NextResponse.json({ error: "Could not load ads." }, { status: 500 });
  }

  return NextResponse.json({ ads: data ?? [] });
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

  const safeUrl = validateTargetUrl(parsed.data.targetUrl);
  if (!safeUrl) {
    return NextResponse.json(
      {
        error:
          "Link must be an https:// URL, http://localhost, or an in-app path like /contact.",
      },
      { status: 400 },
    );
  }

  const startsAt = parsed.data.startsAt || null;
  const endsAt = parsed.data.endsAt || null;
  if (startsAt && endsAt && Date.parse(endsAt) < Date.parse(startsAt)) {
    return NextResponse.json(
      { error: "End date must be after start date." },
      { status: 400 },
    );
  }

  const row = {
    title: parsed.data.title,
    description: parsed.data.description?.trim() || null,
    sponsor_name: parsed.data.sponsorName,
    cta_label: parsed.data.ctaLabel,
    target_url: safeUrl,
    image_path: parsed.data.imagePath?.trim() || null,
    placement: parsed.data.placement,
    is_active: parsed.data.isActive,
    sort_order: parsed.data.sortOrder,
    starts_at: startsAt,
    ends_at: endsAt,
    updated_at: new Date().toISOString(),
    created_by: auth.profile.id,
  };

  if (parsed.data.id) {
    const { data, error } = await db
      .from("sponsored_ads")
      .update(row)
      .eq("id", parsed.data.id)
      .select(SPONSORED_AD_COLUMNS)
      .single();

    if (error) {
      logServerEvent("error", "sponsored_ad_update_failed", { message: error.message });
      return NextResponse.json({ error: "Could not update ad." }, { status: 500 });
    }
    return NextResponse.json({ ad: data });
  }

  const { data, error } = await db
    .from("sponsored_ads")
    .insert(row)
    .select(SPONSORED_AD_COLUMNS)
    .single();

  if (error) {
    logServerEvent("error", "sponsored_ad_insert_failed", { message: error.message });
    return NextResponse.json({ error: "Could not create ad." }, { status: 500 });
  }

  return NextResponse.json({ ad: data }, { status: 201 });
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
  const hard = request.nextUrl.searchParams.get("hard") === "1";
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  if (hard) {
    const { error } = await db.from("sponsored_ads").delete().eq("id", id);
    if (error) {
      logServerEvent("error", "sponsored_ad_delete_failed", { message: error.message });
      return NextResponse.json({ error: "Could not delete ad." }, { status: 500 });
    }
  } else {
    const { error } = await db
      .from("sponsored_ads")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      logServerEvent("error", "sponsored_ad_deactivate_failed", {
        message: error.message,
      });
      return NextResponse.json({ error: "Could not deactivate ad." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
