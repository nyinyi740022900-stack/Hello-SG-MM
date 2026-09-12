/**
 * Admin-managed free Myanmar driving-licence helpers.
 */

export type DrivingHelperRow = {
  id: string;
  name_en: string;
  name_my: string;
  description_en: string | null;
  description_my: string | null;
  image_path: string | null;
  facebook_url: string | null;
  telegram_url: string | null;
  whatsapp_url: string | null;
  group_url: string | null;
  website_url: string | null;
  is_free: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export const DRIVING_HELPER_COLUMNS =
  "id,name_en,name_my,description_en,description_my,image_path,facebook_url,telegram_url,whatsapp_url,group_url,website_url,is_free,is_active,sort_order,created_at,updated_at";

const HELPER_IMAGE_BUCKET = "helper-images";

export function helperImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${HELPER_IMAGE_BUCKET}/${path}`;
}

/** https only (or empty). Used for social / group / website fields. */
export function validateOptionalHttpsUrl(url: string | null | undefined): string | null | false {
  if (url == null) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:") return parsed.toString();
    if (parsed.protocol === "http:" && parsed.hostname === "localhost") {
      return parsed.toString();
    }
    return false;
  } catch {
    return false;
  }
}
