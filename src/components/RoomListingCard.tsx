import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {
  formatPriceSgd,
  formatListingExpiry,
  roomImageUrls,
  type RoomListingRow,
} from "@/lib/roomListings";
import type { AppLocale } from "@/i18n/routing";

type RoomListingCardProps = {
  listing: RoomListingRow;
  locale: AppLocale;
  areaLabel: string;
  monthLabel: string;
  userPostedLabel: string;
  expiresLabel?: string;
};

export default function RoomListingCard({
  listing,
  locale,
  areaLabel,
  monthLabel,
  userPostedLabel,
  expiresLabel,
}: RoomListingCardProps) {
  const images = roomImageUrls(listing.image_paths);
  const thumb = images[0] ?? null;
  const price = formatPriceSgd(Number(listing.price_sgd), locale);
  const expiry = formatListingExpiry(listing.expires_at, locale);

  return (
    <Link
      href={`/housing/${listing.id}`}
      locale={locale}
      className="flex gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-3 transition hover:border-brand-soft-border hover:bg-brand-soft"
    >
      {thumb ? (
        <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
          <Image src={thumb} alt="" fill sizes="80px" className="object-cover" />
        </span>
      ) : (
        <span className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-xs font-semibold text-brand-strong">
          Room
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="mb-1 inline-flex rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-semibold text-warning">
          {userPostedLabel}
        </span>
        <span className="block font-semibold text-ink">{listing.title}</span>
        <span className="mt-0.5 block text-xs text-ink-subtle">
          {areaLabel}: {listing.area}
        </span>
        <span className="mt-1 block text-sm font-semibold text-brand-strong">
          {price}
          <span className="font-normal text-ink-muted"> / {monthLabel}</span>
        </span>
        {expiry && expiresLabel ? (
          <span className="mt-0.5 block text-[11px] text-ink-subtle">
            {expiresLabel}: {expiry}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
