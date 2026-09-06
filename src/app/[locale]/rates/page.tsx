import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { PageHeader, Card } from "@/components/ui/Card";
import { routing } from "@/i18n/routing";
import PageCard from "@/components/ui/PageCard";
import { listLatestRates, formatRate, formatObservedAt } from "@/lib/exchangeRates";

const CHECK_LINKS = [
  { key: "kbzpay", label: "KBZPay", href: "https://www.kbzbank.com/" },
  { key: "wavemoney", label: "Wave Money", href: "https://www.wavemoney.com.mm/" },
  { key: "mas", label: "MAS licensed remittance list", href: "https://eservices.mas.gov.sg/fid" },
] as const;

const COMPARE_KEYS = ["compareFee", "compareOfficial"] as const;

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
  const { data: rates } = await listLatestRates();

  return (
    <PageCard>
      <section className="space-y-5">
        <PageHeader eyebrow={t("pageBadge")} title={t("pageTitle")} subtitle={t("pageSubtitle")} />

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
                    <p className="font-medium text-ink">{t(`provider.${row.provider}`)}</p>
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
            {COMPARE_KEYS.map((key) => (
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
