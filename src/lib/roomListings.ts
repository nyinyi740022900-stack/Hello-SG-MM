/**
 * User-posted room listings (Housing Phase A).
 * Separate from news `housing` category — always label as user-posted.
 */

export type RoomListingStatus =
  | "pending"
  | "published"
  | "rejected"
  | "expired";

export type RoomListingRow = {
  id: string;
  poster_id: string;
  title: string;
  description: string;
  area: string;
  price_sgd: number;
  contact: string;
  image_paths: string[];
  status: RoomListingStatus;
  admin_note: string | null;
  report_count: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export const ROOM_LISTING_COLUMNS =
  "id,poster_id,title,description,area,price_sgd,contact,image_paths,status,admin_note,report_count,reviewed_by,reviewed_at,published_at,expires_at,created_at,updated_at";

const ROOM_IMAGE_BUCKET = "room-images";

/** Days a listing stays live after admin publish. */
export const ROOM_LISTING_TTL_DAYS = 45;

/** Post quotas (DB-backed, not in-memory). */
export const ROOM_POST_DAILY_LIMIT = 2;
export const ROOM_POST_MONTHLY_LIMIT = 8;
/** Pending + published at the same time. */
export const ROOM_ACTIVE_CONCURRENT_LIMIT = 3;

/** Unique reports before a published listing is auto-hidden. */
export const ROOM_LISTING_REPORT_HIDE_AT = 3;

export const MAX_ROOM_IMAGES = 3;

export function roomImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${ROOM_IMAGE_BUCKET}/${path}`;
}

export function roomImageUrls(paths: string[] | null | undefined): string[] {
  if (!paths?.length) return [];
  return paths
    .map((path) => roomImageUrl(path))
    .filter((url): url is string => Boolean(url));
}

export function formatPriceSgd(price: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale === "my" ? "en-SG" : locale, {
      style: "currency",
      currency: "SGD",
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `S$${Math.round(price)}`;
  }
}

export function expiresAtFromPublish(from = new Date()): string {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + ROOM_LISTING_TTL_DAYS);
  return d.toISOString();
}

/** Short date for “Expires on …” labels. */
export function formatListingExpiry(
  expiresAt: string | null | undefined,
  locale: string,
): string | null {
  if (!expiresAt) return null;
  try {
    return new Date(expiresAt).toLocaleDateString(
      locale === "my" ? "en-SG" : locale,
      { dateStyle: "medium" },
    );
  } catch {
    return expiresAt.slice(0, 10);
  }
}
