import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { PageHeader, Card } from "@/components/ui/Card";
import PageCard from "@/components/ui/PageCard";
import StatusMessage from "@/components/ui/StatusMessage";
import JobListingReportButton from "@/components/JobListingReportButton";
import JobApplyForm from "@/components/JobApplyForm";
import { routing, type AppLocale } from "@/i18n/routing";
import { getPublishedJobListing } from "@/lib/jobListings.server";
import { formatJobExpiry, isJobFeatured, jobImageUrls } from "@/lib/jobListings";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const resolvedLocale = locale as AppLocale;
  const t = await getTranslations("jobs");

  const listing = await getPublishedJobListing(id);
  if (!listing) {
    return (
      <PageCard>
        <section className="space-y-4">
          <PageHeader eyebrow={t("badge")} title={t("notFoundTitle")} />
          <Card>
            <p className="text-ink-muted">{t("notFoundBody")}</p>
            <Link
              href="/jobs"
              locale={resolvedLocale}
              className="mt-3 inline-flex text-sm font-medium text-brand-strong underline"
            >
              {t("backToList")}
            </Link>
          </Card>
        </section>
      </PageCard>
    );
  }

  const images = jobImageUrls(listing.image_paths);
  const featured = isJobFeatured(listing);
  const expiry = formatJobExpiry(listing.expires_at, resolvedLocale);

  return (
    <PageCard>
      <section className="space-y-6">
        <Link
          href="/jobs"
          locale={resolvedLocale}
          className="text-sm font-medium text-brand-strong underline"
        >
          {t("backToList")}
        </Link>

        <PageHeader
          eyebrow={featured ? `${t("agencyListing")} · ${t("featured")}` : t("agencyListing")}
          title={listing.title}
          subtitle={`${listing.sector} · ${listing.location_area}${
            expiry ? ` · ${t("expires")}: ${expiry}` : ""
          }`}
        />

        <StatusMessage variant="warning">{t("disclaimer")}</StatusMessage>

        {listing.salary_text ? (
          <p className="text-lg font-semibold text-brand-strong">{listing.salary_text}</p>
        ) : null}

        {images.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {images.map((src) => (
              <div
                key={src}
                className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-surface-muted"
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ) : null}

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("aboutJob")}</h3>
          <p className="whitespace-pre-line text-ink">{listing.description}</p>
          {listing.mom_licence ? (
            <p className="text-sm text-ink-muted">
              {t("momLicenceLabel")}:{" "}
              <span className="font-medium text-ink">{listing.mom_licence}</span>
            </p>
          ) : null}
          <div className="rounded-xl border border-border bg-surface-muted p-3">
            <p className="text-xs font-medium text-ink-subtle">{t("contactLabel")}</p>
            <p className="mt-1 font-semibold text-ink">{listing.contact}</p>
            <p className="mt-2 text-xs text-ink-subtle">{t("contactHint")}</p>
          </div>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("applyTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("applyIntro")}</p>
          <JobApplyForm jobId={listing.id} locale={resolvedLocale} />
        </Card>

        <Card className="space-y-2">
          <h3 className="font-semibold text-ink">{t("reportTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("reportIntro")}</p>
          <JobListingReportButton listingId={listing.id} locale={resolvedLocale} />
        </Card>
      </section>
    </PageCard>
  );
}
