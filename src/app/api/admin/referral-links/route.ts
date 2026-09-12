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

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  url: z.string().trim().url().max(2000),
  linkType: z.enum(["affiliate", "invitation"]),
  placement: z.enum([
    "bank",
    "paynow",
    "singpass",
    "grabpay",
    "page",
    "remittance",
    "travel",
  ]),
  ctaLabel: z.string().trim().min(1).max(60).default("Open link"),
  partnerName: z.string().trim().max(120).optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

function validateHttpsUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    // Allow https always; http only for localhost testing
    if (parsed.protocol === "http:" && parsed.hostname !== "localhost") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/** List all referral links (admin). */
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
    .from("referral_links")
    .select(
      "id,title,description,url,link_type,placement,cta_label,partner_name,is_active,sort_order,created_at,updated_at",
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    logServerEvent("error", "referral_links_list_failed", { message: error.message });
    return NextResponse.json({ error: "Could not load links." }, { status: 500 });
  }

  return NextResponse.json({ links: data ?? [] });
}

/** Create or update a referral link (admin). */
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

  const safeUrl = validateHttpsUrl(parsed.data.url);
  if (!safeUrl) {
    return NextResponse.json(
      { error: "URL must start with https:// (or http://localhost for testing)." },
      { status: 400 },
    );
  }

  const row = {
    title: parsed.data.title,
    description: parsed.data.description?.trim() || null,
    url: safeUrl,
    link_type: parsed.data.linkType,
    placement: parsed.data.placement,
    cta_label: parsed.data.ctaLabel,
    partner_name: parsed.data.partnerName?.trim() || null,
    is_active: parsed.data.isActive,
    sort_order: parsed.data.sortOrder,
    updated_at: new Date().toISOString(),
    created_by: auth.profile.id,
  };

  if (parsed.data.id) {
    const { data, error } = await db
      .from("referral_links")
      .update(row)
      .eq("id", parsed.data.id)
      .select(
        "id,title,description,url,link_type,placement,cta_label,partner_name,is_active,sort_order,created_at,updated_at",
      )
      .single();

    if (error) {
      logServerEvent("error", "referral_link_update_failed", { message: error.message });
      return NextResponse.json({ error: "Could not update link." }, { status: 500 });
    }
    return NextResponse.json({ link: data });
  }

  const { data, error } = await db
    .from("referral_links")
    .insert(row)
    .select(
      "id,title,description,url,link_type,placement,cta_label,partner_name,is_active,sort_order,created_at,updated_at",
    )
    .single();

  if (error) {
    logServerEvent("error", "referral_link_insert_failed", { message: error.message });
    return NextResponse.json({ error: "Could not create link." }, { status: 500 });
  }

  return NextResponse.json({ link: data }, { status: 201 });
}

/** Soft-deactivate or hard-delete a referral link (admin). */
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
    const { error } = await db.from("referral_links").delete().eq("id", id);
    if (error) {
      logServerEvent("error", "referral_link_delete_failed", { message: error.message });
      return NextResponse.json({ error: "Could not delete link." }, { status: 500 });
    }
  } else {
    const { error } = await db
      .from("referral_links")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      logServerEvent("error", "referral_link_deactivate_failed", { message: error.message });
      return NextResponse.json({ error: "Could not deactivate link." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
