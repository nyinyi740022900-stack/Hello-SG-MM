import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {
  formatJobExpiry,
  isJobFeatured,
  jobImageUrls,
  type JobListingRow,
} from "@/lib/jobListings";
import type { AppLocale } from "@/i18n/routing";

type JobListingCardProps = {
  listing: JobListingRow;
  locale: AppLocale;
  sectorLabel: string;
  agencyLabel: string;
  featuredLabel: string;
  expiresLabel?: string;
};

export default function JobListingCard({
  listing,
  locale,
  sectorLabel,
  agencyLabel,
  featuredLabel,
  expiresLabel,
}: JobListingCardProps) {
  const images = jobImageUrls(listing.image_paths);
  const thumb = images[0] ?? null;
  const featured = isJobFeatured(listing);
  const expiry = formatJobExpiry(listing.expires_at, locale);

  return (
    <Link
      href={`/jobs/${listing.id}`}
      locale={locale}
      className="flex gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-3 transition hover:border-brand-soft-border hover:bg-brand-soft"
    >
      {thumb ? (
        <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
          <Image src={thumb} alt="" fill sizes="80px" className="object-cover" />
        </span>
      ) : (
        <span className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-xs font-semibold text-brand-strong">
          Job
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="mb-1 flex flex-wrap gap-1">
          <span className="inline-flex rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
            {agencyLabel}
          </span>
          {featured ? (
            <span className="inline-flex rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-semibold text-warning">
              {featuredLabel}
            </span>
          ) : null}
        </span>
        <span className="block font-semibold text-ink">{listing.title}</span>
        <span className="mt-0.5 block text-xs text-ink-subtle">
          {sectorLabel}: {listing.sector} · {listing.location_area}
        </span>
        {listing.salary_text ? (
          <span className="mt-1 block text-sm font-semibold text-brand-strong">
            {listing.salary_text}
          </span>
        ) : null}
        {expiry && expiresLabel ? (
          <span className="mt-0.5 block text-[11px] text-ink-subtle">
            {expiresLabel}: {expiry}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
