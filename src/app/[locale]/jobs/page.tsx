import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { PageHeader, Card } from "@/components/ui/Card";
import PageCard from "@/components/ui/PageCard";
import StatusMessage from "@/components/ui/StatusMessage";
import JobListingCard from "@/components/JobListingCard";
import { LinkButton } from "@/components/ui/Button";
import { routing, type AppLocale } from "@/i18n/routing";
import { listPublishedJobListings } from "@/lib/jobListings.server";

export const dynamic = "force-dynamic";

export default async function JobsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const resolvedLocale = locale as AppLocale;

  const t = await getTranslations("jobs");
  const listings = await listPublishedJobListings();

  return (
    <PageCard>
      <section className="space-y-6">
        <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

        <StatusMessage variant="warning">{t("disclaimer")}</StatusMessage>

        <div className="flex flex-wrap gap-3">
          <LinkButton href="/jobs/post" locale={resolvedLocale}>
            {t("postCta")}
          </LinkButton>
          <LinkButton href="/jobs/mine" locale={resolvedLocale} variant="secondary">
            {t("mineCta")}
          </LinkButton>
        </div>

        {listings.length === 0 ? (
          <Card className="space-y-2">
            <p className="text-ink-muted">{t("empty")}</p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {listings.map((listing) => (
              <li key={listing.id}>
                <JobListingCard
                  listing={listing}
                  locale={resolvedLocale}
                  sectorLabel={t("sector")}
                  agencyLabel={t("agencyListing")}
                  featuredLabel={t("featured")}
                  expiresLabel={t("expires")}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageCard>
  );
}
