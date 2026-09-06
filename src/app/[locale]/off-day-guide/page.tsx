import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { PageHeader, Card } from "@/components/ui/Card";
import { routing } from "@/i18n/routing";

const LOCATIONS = [
  {
    key: "peninsulaPlaza",
    address: "111 North Bridge Road, Singapore 179098",
    mapsQuery: "Peninsula Plaza Singapore",
  },
  {
    key: "burmeseTemple",
    address: "14 Tai Gin Road, Singapore 327873",
    mapsQuery: "Burmese Buddhist Temple Singapore",
  },
  {
    key: "farrerPark",
    address: "Stamford Road / Farrer Park / Little India area",
    mapsQuery: "Farrer Park MRT Singapore",
  },
] as const;

export default async function OffDayGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations("offDayGuide");

  return (
    <section className="space-y-5">
      <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

      <div className="space-y-3">
        {LOCATIONS.map((loc) => (
          <Card key={loc.key} className="space-y-2">
            <h3 className="font-semibold text-ink">{t(`locations.${loc.key}.name`)}</h3>
            <p className="text-sm text-ink-muted">{t(`locations.${loc.key}.description`)}</p>
            <p className="text-xs text-ink-subtle">{loc.address}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.mapsQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex text-xs font-medium text-brand-strong underline"
            >
              {t("openInMaps")}
            </a>
          </Card>
        ))}
      </div>

      <p className="text-xs text-ink-subtle">{t("sourceDisclaimer")}</p>
    </section>
  );
}
