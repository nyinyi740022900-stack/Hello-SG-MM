import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { PageHeader, Card } from "@/components/ui/Card";
import PageCard from "@/components/ui/PageCard";
import StatusMessage from "@/components/ui/StatusMessage";
import RoomListingCard from "@/components/RoomListingCard";
import { LinkButton } from "@/components/ui/Button";
import { routing, type AppLocale } from "@/i18n/routing";
import { listPublishedRoomListings } from "@/lib/roomListings.server";

export const dynamic = "force-dynamic";

export default async function HousingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const resolvedLocale = locale as AppLocale;

  const t = await getTranslations("housing");
  const listings = await listPublishedRoomListings();

  return (
    <PageCard>
      <section className="space-y-6">
        <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

        <StatusMessage variant="warning">{t("disclaimer")}</StatusMessage>

        <div className="flex flex-wrap gap-3">
          <LinkButton href="/housing/post" locale={resolvedLocale}>
            {t("postCta")}
          </LinkButton>
        </div>

        {listings.length === 0 ? (
          <Card className="space-y-2">
            <p className="text-ink-muted">{t("empty")}</p>
            <Link
              href="/housing/post"
              locale={resolvedLocale}
              className="text-sm font-medium text-brand-strong underline"
            >
              {t("beFirst")}
            </Link>
          </Card>
        ) : (
          <ul className="space-y-3">
            {listings.map((listing) => (
              <li key={listing.id}>
                <RoomListingCard
                  listing={listing}
                  locale={resolvedLocale}
                  areaLabel={t("area")}
                  monthLabel={t("perMonth")}
                  userPostedLabel={t("userPosted")}
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
