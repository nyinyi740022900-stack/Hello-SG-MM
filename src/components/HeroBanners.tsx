import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { WalletIcon } from "@/components/icons";
import { getMarketRate } from "@/lib/fxRate";
import { listLatestRates, formatRate } from "@/lib/exchangeRates";
import type { AppLocale } from "@/i18n/routing";
import { resolveSelectedCountry } from "@/lib/country.server";

/**
 * The rate for the reader's own country, above the feed.
 *
 * Transport used to sit beside this as a second banner. It is still one tap
 * away in the shortcut rail, and giving it banner weight pushed the news feed
 * — the reason the page exists — further down the screen for something that is
 * not time-sensitive.
 *
 * The figure shown is either an observed money-changer reading or the
 * international rate. It is never Myanmar's official rate: see lib/fxRate.ts
 * for why that number would mislead precisely the readers who most need it.
 */
export default async function HeroBanners({ locale }: { locale: AppLocale }) {
  const tRates = await getTranslations("rates");
  const country = await resolveSelectedCountry();

  const { data: recorded } = await listLatestRates(`SGD_${country.currency}`);
  const observed = recorded?.[0] ?? null;
  const feed = observed ? null : await getMarketRate(country.currency);
  const rate = observed?.rate ?? feed?.rate ?? null;

  return (
    <Link
      href="/rates"
      locale={locale}
      className="flex items-center gap-3 rounded-2xl border border-warning-border bg-warning-soft p-4 transition hover:opacity-90"
    >
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-warning">
        <WalletIcon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-ink">{tRates("heroTitle")}</span>
        {rate !== null ? (
          <>
            <span className="block truncate text-sm font-bold tabular-nums text-ink">
              {tRates("rateValue", {
                rate: formatRate(rate, locale),
                currency: country.currency,
              })}
            </span>
            <span className="block truncate text-[11px] text-warning">
              {tRates("indicative")}
            </span>
          </>
        ) : (
          <span className="block truncate text-xs text-ink-muted">
            {tRates("noMarketRate")}
          </span>
        )}
      </span>
    </Link>
  );
}
