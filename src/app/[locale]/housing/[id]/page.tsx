import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { PageHeader, Card } from "@/components/ui/Card";
import PageCard from "@/components/ui/PageCard";
import StatusMessage from "@/components/ui/StatusMessage";
import RoomListingReportButton from "@/components/RoomListingReportButton";
import { routing, type AppLocale } from "@/i18n/routing";
import { getPublishedRoomListing } from "@/lib/roomListings.server";
import { formatPriceSgd, formatListingExpiry, roomImageUrls } from "@/lib/roomListings";

export const dynamic = "force-dynamic";

export default async function HousingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const resolvedLocale = locale as AppLocale;
  const t = await getTranslations("housing");

  const listing = await getPublishedRoomListing(id);
  if (!listing) {
    return (
      <PageCard>
        <section className="space-y-4">
          <PageHeader eyebrow={t("badge")} title={t("notFoundTitle")} />
          <Card>
            <p className="text-ink-muted">{t("notFoundBody")}</p>
            <Link
              href="/housing"
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

  const images = roomImageUrls(listing.image_paths);
  const price = formatPriceSgd(Number(listing.price_sgd), resolvedLocale);
  const expiry = formatListingExpiry(listing.expires_at, resolvedLocale);

  return (
    <PageCard>
      <section className="space-y-6">
        <Link
          href="/housing"
          locale={resolvedLocale}
          className="text-sm font-medium text-brand-strong underline"
        >
          {t("backToList")}
        </Link>

        <PageHeader
          eyebrow={t("userPosted")}
          title={listing.title}
          subtitle={`${listing.area} · ${price} / ${t("perMonth")}${
            expiry ? ` · ${t("expires")}: ${expiry}` : ""
          }`}
        />

        <StatusMessage variant="warning">{t("disclaimer")}</StatusMessage>

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
          <h3 className="font-semibold text-ink">{t("aboutRoom")}</h3>
          <p className="whitespace-pre-line text-ink">{listing.description}</p>
          <div className="rounded-xl border border-border bg-surface-muted p-3">
            <p className="text-xs font-medium text-ink-subtle">{t("contactLabel")}</p>
            <p className="mt-1 font-semibold text-ink">{listing.contact}</p>
            <p className="mt-2 text-xs text-ink-subtle">{t("contactHint")}</p>
          </div>
        </Card>

        <Card className="space-y-2">
          <h3 className="font-semibold text-ink">{t("reportTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("reportIntro")}</p>
          <RoomListingReportButton listingId={listing.id} locale={resolvedLocale} />
        </Card>
      </section>
    </PageCard>
  );
}
