import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  SPONSORED_AD_COLUMNS,
  type AdPlacement,
  type SponsoredAdRow,
} from "@/lib/sponsoredAds";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Active ads for one public placement (anon-readable via RLS). */
export async function listActiveAdsForPlacement(
  placement: AdPlacement,
): Promise<SponsoredAdRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("sponsored_ads")
    .select(SPONSORED_AD_COLUMNS)
    .eq("placement", placement)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<SponsoredAdRow[]>();

  if (error) {
    console.error("[listActiveAdsForPlacement]", error.message);
    return [];
  }

  const now = Date.now();
  return (data ?? []).filter((ad) => {
    if (ad.starts_at && Date.parse(ad.starts_at) > now) return false;
    if (ad.ends_at && Date.parse(ad.ends_at) < now) return false;
    return true;
  });
}

/** All ads for admin panel (includes inactive). */
export async function getAdminSponsoredAds(): Promise<SponsoredAdRow[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data, error } = await db
    .from("sponsored_ads")
    .select(SPONSORED_AD_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<SponsoredAdRow[]>();

  if (error) {
    console.error("[getAdminSponsoredAds]", error.message);
    return [];
  }

  return data ?? [];
}
