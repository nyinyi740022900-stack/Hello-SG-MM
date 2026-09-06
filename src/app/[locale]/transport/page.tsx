import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { PageHeader, Card } from "@/components/ui/Card";
import { routing } from "@/i18n/routing";
import PageCard from "@/components/ui/PageCard";
import StatusMessage from "@/components/ui/StatusMessage";

const TRANSFER_KEYS = ["transferTime", "transferSameBus", "transferStations"] as const;
const MISTAKE_KEYS = ["mistake1", "mistake2", "mistake3", "mistake4"] as const;

const MAP_LINKS = [
  {
    key: "mapsPlanner",
    href: "https://www.lta.gov.sg/content/ltagov/en/map/journey-planner.html",
  },
  {
    key: "mapsFare",
    href: "https://www.lta.gov.sg/content/ltagov/en/map/fare-calculator.html",
  },
  {
    key: "mapsNetwork",
    href: "https://www.lta.gov.sg/content/ltagov/en/getting_around/public_transport/rail_network.html",
  },
  { key: "mapsSimplyGo", href: "https://simplygo.com.sg/" },
  { key: "mapsGoogle", href: "https://www.google.com/maps" },
] as const;

function StepNumber({ index }: { index: number }) {
  return (
    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
      {index + 1}
    </span>
  );
}

export default async function TransportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations("transport");

  return (
    <PageCard>
      <section className="space-y-5">
        <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("payTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("payIntro")}</p>
          <ul className="space-y-3">
            {(["payCard", "payBank", "payBalance"] as const).map((key, index) => (
              <li key={key} className="flex items-start gap-3">
                <StepNumber index={index} />
                <span className="text-ink">{t(key)}</span>
              </li>
            ))}
          </ul>
          <StatusMessage variant="info">{t("payNoDisplay")}</StatusMessage>
          <StatusMessage variant="warning">{t("payAxs")}</StatusMessage>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("tapTitle")}</h3>
          <ul className="space-y-3">
            {(["tapIn", "tapOut"] as const).map((key, index) => (
              <li key={key} className="flex items-start gap-3">
                <StepNumber index={index} />
                <span className="text-ink">{t(key)}</span>
              </li>
            ))}
          </ul>
          <StatusMessage variant="error">{t("tapWarning")}</StatusMessage>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("fareTitle")}</h3>
          <ul className="space-y-2 text-ink">
            <li>{t("fareDistance")}</li>
            <li>{t("fareTransfer")}</li>
          </ul>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("transferTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("transferIntro")}</p>
          <ul className="space-y-3">
            {TRANSFER_KEYS.map((key, index) => (
              <li key={key} className="flex items-start gap-3">
                <StepNumber index={index} />
                <span className="text-ink">{t(key)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("mapsTitle")}</h3>
          <ul className="space-y-2">
            {MAP_LINKS.map(({ key, href }) => (
              <li key={key}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-muted p-3 text-ink hover:bg-brand-soft"
                >
                  <span>{t(key)}</span>
                  <span aria-hidden="true" className="text-ink-subtle">
                    &rarr;
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-subtle">{t("mapsTip")}</p>
        </Card>

        <div className="space-y-3 rounded-2xl border border-border bg-warning-soft p-4 sm:p-5">
          <h3 className="font-semibold text-warning">{t("mistakesTitle")}</h3>
          <ul className="space-y-2">
            {MISTAKE_KEYS.map((key) => (
              <li key={key} className="flex items-start gap-2 text-ink">
                <span aria-hidden="true" className="mt-0.5 shrink-0 font-bold text-warning">
                  &#9888;
                </span>
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-ink-subtle">{t("disclaimer")}</p>
      </section>
    </PageCard>
  );
}
