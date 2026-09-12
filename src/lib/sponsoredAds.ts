/**
 * Sponsored banner ads managed from Admin → Ads.
 */

export const AD_PLACEMENTS = [
  "home_bottom",
  "guide_bottom",
  "home_top",
] as const;

export type AdPlacement = (typeof AD_PLACEMENTS)[number];

export const AD_PLACEMENT_LABELS: Record<AdPlacement, string> = {
  home_bottom: "Home — bottom banner",
  guide_bottom: "Passport guide — bottom banner",
  home_top: "Home — top banner",
};

export type SponsoredAdRow = {
  id: string;
  title: string;
  description: string | null;
  sponsor_name: string;
  cta_label: string;
  target_url: string;
  image_path: string | null;
  placement: AdPlacement;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export const SPONSORED_AD_COLUMNS =
  "id,title,description,sponsor_name,cta_label,target_url,image_path,placement,is_active,sort_order,starts_at,ends_at,created_at,updated_at";

const AD_IMAGE_BUCKET = "ad-images";

/** Public URL for an image stored in the ad-images bucket. */
export function adImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${AD_IMAGE_BUCKET}/${path}`;
}

export function isAdPlacement(value: string): value is AdPlacement {
  return (AD_PLACEMENTS as readonly string[]).includes(value);
}
