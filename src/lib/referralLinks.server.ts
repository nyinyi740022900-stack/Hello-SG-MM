import { createClient } from "@supabase/supabase-js";
import type { ReferralLinkRow, ReferralPlacement } from "@/lib/accountsGuide";

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

/** Active referral links for the public Accounts Guide. */
export async function getActiveReferralLinks(): Promise<ReferralLinkRow[]> {
  const db = anonClient();
  if (!db) return [];

  const { data, error } = await db
    .from("referral_links")
    .select(
      "id,title,description,url,link_type,placement,cta_label,partner_name,is_active,sort_order,created_at,updated_at",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<ReferralLinkRow[]>();

  if (error) {
    console.error("[getActiveReferralLinks]", error.message);
    return [];
  }
  return data ?? [];
}

/** All referral links for the admin panel (active + inactive). */
export async function getAdminReferralLinks(): Promise<ReferralLinkRow[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data, error } = await db
    .from("referral_links")
    .select(
      "id,title,description,url,link_type,placement,cta_label,partner_name,is_active,sort_order,created_at,updated_at",
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<ReferralLinkRow[]>();

  if (error) {
    console.error("[getAdminReferralLinks]", error.message);
    return [];
  }
  return data ?? [];
}

export function groupReferralsByPlacement(
  links: ReferralLinkRow[],
): Record<ReferralPlacement, ReferralLinkRow[]> {
  const grouped: Record<ReferralPlacement, ReferralLinkRow[]> = {
    bank: [],
    paynow: [],
    singpass: [],
    grabpay: [],
    page: [],
    remittance: [],
    travel: [],
  };
  for (const link of links) {
    grouped[link.placement].push(link);
  }
  return grouped;
}
