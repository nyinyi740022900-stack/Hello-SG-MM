import { getTranslations } from "next-intl/server";
import { TransferIcon } from "@/components/icons";
import {
  listLatestRates,
  formatRate,
  formatObservedAt,
  type RateProvider,
} from "@/lib/exchangeRates";
import type { AppLocale } from "@/i18n/routing";

/**
 * Workers check the remittance rate constantly, so it earns a permanent strip
 * near the top of the home page. Every reading carries its provider and how
 * long ago it was observed, and the whole strip is labelled indicative — see
 * lib/exchangeRates.ts for why that is non-negotiable.
 *
 * Renders nothing when there is no recent reading. An empty rate box invites
 * more doubt than no box at all.
 */
export default async function ExchangeRateBar({ locale }: { locale: AppLocale }) {
  const t = await getTranslations("rates");
  const { data: rates } = await listLatestRates();

  if (!rates || rates.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={t("title")}
      className="rounded-2xl border border-border bg-surface p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-strong">
          <TransferIcon className="h-4.5 w-4.5" />
        </span>
        <span className="font-semibold text-ink">{t("title")}</span>
        <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">
          {t("indicative")}
        </span>
      </div>

      <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rates.map((rate) => (
          <div
            key={rate.id}
            className="flex items-baseline justify-between gap-3 rounded-xl bg-surface-muted px-3 py-2"
          >
            <dt className="text-sm text-ink-muted">
              {t(`provider.${rate.provider satisfies RateProvider}`)}
            </dt>
            <dd className="text-right">
              <span className="text-base font-bold tabular-nums text-ink">
                {formatRate(rate.rate, locale)}
              </span>
              <span className="block text-xs text-ink-subtle">
                {formatObservedAt(rate.observed_at, locale)}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 text-xs text-ink-subtle">{t("disclaimer")}</p>
    </section>
  );
}
