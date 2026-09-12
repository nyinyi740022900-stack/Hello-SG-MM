import { getTranslations } from "next-intl/server";
import { COUNTRIES, type CountryCode } from "@/lib/countries";
import { getMarketRates } from "@/lib/fxRate";
import { listLatestRatesByPair, formatRate, formatObservedAt } from "@/lib/exchangeRates";
import type { AppLocale } from "@/i18n/routing";

/**
 * Every country's rate in one place: SGD to MMK, INR, CNY, BDT and MYR.
 *
 * One panel rather than a per-country strip because a rate is the thing people
 * open the app to check, and someone comparing what to send home should not
 * have to switch their country setting to see another number. The reader's own
 * country is highlighted rather than being the only row.
 *
 * MMK has no row from the feed. Every published SGD/MMK rate — the central
 * bank's, Wise's, XE's, this feed's — is the official one near 1,650, while
 * money changers deal near 3,250+, and no bank or e-wallet in this corridor
 * publishes the second number. So the kyat row is filled from an independent
 * daily rate tracker instead (see lib/rateSync.server.ts for the reliability
 * caveats that come with that), or from an admin's own observed reading when
 * one is more recent, and says plainly when neither exists.
 *
 * Any observed reading — the kyat's or another currency's — names its source
 * beneath the figure. A number with no named source reads as authoritative by
 * default; naming where a reading came from is what lets someone weigh it.
 *
 * Street / bank / admin readings always beat the mid-market feed: they are
 * what someone can actually transact at. Cron-copied mid-market rows
 * (`provider: market`) only win when they are at least as fresh as the live
 * feed — otherwise a missed cron day would pin the panel on yesterday's
 * number while the feed already moved.
 */
const FEED_SOURCE_NAME = "exchangerate-api.com (mid-market)";

function isFeedFresher(
  feedUpdatedAt: string | null | undefined,
  recordedAt: string,
): boolean {
  if (!feedUpdatedAt) return false;
  const feedMs = Date.parse(feedUpdatedAt);
  const recordedMs = Date.parse(recordedAt);
  if (!Number.isFinite(feedMs) || !Number.isFinite(recordedMs)) return false;
  return feedMs > recordedMs;
}

export default async function ExchangeRatePanel({
  locale,
  selectedCountry,
}: {
  locale: AppLocale;
  selectedCountry: CountryCode | null;
}) {
  const t = await getTranslations("rates");

  // The feed call and the database read do not depend on each other, so they
  // go out together — awaiting them in sequence added the slower one's
  // latency to the faster one's for no reason.
  //
  // The database read is one query for every pair: a query per currency meant
  // five round trips before this panel could paint.
  const [feedRates, observedByPair] = await Promise.all([
    getMarketRates(),
    listLatestRatesByPair(COUNTRIES.map((country) => `SGD_${country.currency}`)),
  ]);
  const feedByCurrency = new Map(feedRates.map((rate) => [rate.currency, rate]));

  return (
    <section
      aria-labelledby="exchange-rates-heading"
      className="rounded-2xl border border-border bg-surface p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="exchange-rates-heading" className="font-semibold text-ink">
          {t("panelTitle")}
        </h2>
        <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">
          {t("indicative")}
        </span>
      </div>

      <ul className="mt-3 divide-y divide-border">
        {COUNTRIES.map((country) => {
          const feed = feedByCurrency.get(country.currency);
          const recorded = observedByPair.get(`SGD_${country.currency}`);
          const isSelected = country.code === selectedCountry;

          const preferFeed =
            Boolean(feed) &&
            (!recorded ||
              (recorded.provider === "market" &&
                isFeedFresher(feed?.updatedAt, recorded.observed_at)));

          const rate = preferFeed
            ? (feed?.rate ?? null)
            : (recorded?.rate ?? feed?.rate ?? null);
          const age = preferFeed
            ? feed?.updatedAt
              ? formatObservedAt(feed.updatedAt, locale)
              : null
            : recorded
              ? formatObservedAt(recorded.observed_at, locale)
              : feed?.updatedAt
                ? formatObservedAt(feed.updatedAt, locale)
                : null;
          const sourceName = preferFeed
            ? FEED_SOURCE_NAME
            : (recorded?.source_name ?? (feed ? FEED_SOURCE_NAME : null));

          return (
            <li
              key={country.code}
              className={[
                "flex items-center justify-between gap-3 py-2.5",
                isSelected ? "-mx-2 rounded-lg bg-brand-soft px-2" : "",
              ].join(" ")}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span aria-hidden="true" className="text-lg leading-none">
                  {country.flag}
                </span>
                <div className="min-w-0 flex-1">
                  {/* "SGD → XXX" is short and fixed-length — it should never
                      need to truncate, and doing so hid the currency code
                      itself on narrow phones with Burmese digits. */}
                  <p className="text-sm font-medium text-ink">
                    {t("pairLabel", { currency: country.currency })}
                  </p>
                  <p className="truncate text-xs text-ink-subtle">
                    {country.englishName} · {country.currencyName}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                {rate !== null ? (
                  <>
                    <p className="text-base font-bold tabular-nums text-ink">
                      {formatRate(rate, locale)}
                    </p>
                    {age ? <p className="text-[11px] text-ink-subtle">{age}</p> : null}
                    {sourceName ? (
                      <p className="truncate text-[11px] text-ink-subtle">
                        {sourceName}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-xs text-ink-subtle">{t("noMarketRate")}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-ink-subtle">{t("panelDisclaimer")}</p>
    </section>
  );
}
