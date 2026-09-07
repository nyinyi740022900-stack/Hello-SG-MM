import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { PageHeader, Card } from "@/components/ui/Card";
import { routing } from "@/i18n/routing";
import PageCard from "@/components/ui/PageCard";
import { listLatestRates, formatRate, formatObservedAt } from "@/lib/exchangeRates";
import { Suspense } from "react";
import ExchangeRatePanel from "@/components/ExchangeRatePanel";
import { RatePanelSkeleton } from "@/components/PanelSkeleton";
import { resolveSelectedCountry, getSelectedCountryCode } from "@/lib/country.server";

/**
 * Where to check a live rate.
 *
 * Deliberately one link. No Myanmar bank or e-wallet publishes a daily,
 * verifiable rate we can point someone to with confidence — every source we
 * checked was either a static archive, an unexplained figure, or an internal
 * API not meant for this kind of use. The MAS register is different in kind:
 * it does not quote a rate at all, it tells you whether a company is
 * licensed, which is the check that protects the money regardless of which
 * currency you are sending.
 */
const CHECK_LINKS = [
  {
    key: "mas",
    label: "MAS licensed remittance list",
    href: "https://eservices.mas.gov.sg/fid",
  },
];


export default async function RatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations("rates");
  // Both cookie reads and the query are independent; awaiting them one after
  // another only stacked their latency.
  const [country, selectedCountry] = await Promise.all([
    resolveSelectedCountry(),
    getSelectedCountryCode(),
  ]);
  const { data: rates } = await listLatestRates(`SGD_${country.currency}`);


  // The mandatory-remittance rule is Myanmar's, not a general one. Showing it
  // to an Indian or Malaysian reader would assert a legal obligation on them
  // that does not exist.
  const compareKeys = country.code === "mm" ? ["compareFee", "compareOfficial"] : ["compareFee"];

  return (
    <PageCard>
      <section className="space-y-5">
        <PageHeader
          eyebrow={t("pageBadge")}
          title={t("pageTitle", { currency: country.currency })}
          subtitle={t("pageSubtitle")}
        />

        {/* Waits on an external rate feed; the rest of the page does not. */}
        <Suspense fallback={<RatePanelSkeleton />}>
          <ExchangeRatePanel locale={locale} selectedCountry={selectedCountry} />
        </Suspense>

        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-ink">{t("latestTitle")}</h3>
            <span className="inline-flex shrink-0 rounded-full border border-brand-soft-border bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-strong">
              {t("indicative")}
            </span>
          </div>

          {rates && rates.length > 0 ? (
            <ul className="space-y-2">
              {rates.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-muted p-3"
                >
                  <div>
                    <p className="font-medium text-ink">
                      {row.source_name ?? t(`provider.${row.provider}`)}
                    </p>
                    <p className="text-xs text-ink-subtle">{formatObservedAt(row.observed_at, locale)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-ink">{formatRate(row.rate, locale)}</p>
                    <p className="text-xs text-ink-subtle">{t("perSgd")}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-border bg-surface-muted p-4 text-center text-sm text-ink-muted">
              {t("noData")}
            </div>
          )}

          <p className="text-xs text-ink-subtle">{t("disclaimer")}</p>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("checkTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("checkIntro")}</p>
          <ul className="space-y-2">
            {CHECK_LINKS.map(({ key, label, href }) => (
              <li key={key}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-muted p-3 text-ink hover:bg-brand-soft"
                >
                  <span>{label}</span>
                  <span aria-hidden="true" className="text-ink-subtle">
                    &rarr;
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-subtle">{t("providersNote")}</p>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("compareTitle")}</h3>
          <ul className="space-y-2 text-ink">
            {compareKeys.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
          <div className="rounded-xl border border-border bg-warning-soft p-3">
            <p className="font-medium text-warning">{t("compareLicence")}</p>
          </div>
        </Card>
      </section>
    </PageCard>
  );
}
