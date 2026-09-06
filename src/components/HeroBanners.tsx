import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TransferIcon, WalletIcon } from "@/components/icons";
import { getMidMarketRate } from "@/lib/fxRate";
import { formatRate } from "@/lib/exchangeRates";
import type { AppLocale } from "@/i18n/routing";

/**
 * The two things people open this app to check before anything else: how to
 * get somewhere, and what their money is worth. They sit above the feed as
 * banners rather than as two more icons in the rail.
 *
 * The rate shown is the official mid-market figure, and it is labelled as such
 * on the banner itself — not only on the page behind it. For MMK that number
 * is roughly half what a remittance actually converts at, so a bare figure
 * here would be worse than no figure at all.
 */
export default async function HeroBanners({ locale }: { locale: AppLocale }) {
  const tRates = await getTranslations("rates");
  const tTransport = await getTranslations("transport");
  const rate = await getMidMarketRate("MMK");

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Link
        href="/transport"
        locale={locale}
        className="flex items-center gap-3 rounded-2xl border border-brand-soft-border bg-brand-soft p-4 transition hover:opacity-90"
      >
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-brand-strong">
          <TransferIcon className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold text-ink">{tTransport("heroTitle")}</span>
          <span className="block truncate text-xs text-ink-muted">
            {tTransport("badge")}
          </span>
        </span>
      </Link>

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
          {rate ? (
            <>
              <span className="block truncate text-sm font-bold tabular-nums text-ink">
                {tRates("officialValue", { rate: formatRate(rate.rate, locale) })}
              </span>
              <span className="block truncate text-[11px] text-warning">
                {tRates("officialLabel")} · {tRates("indicative")}
              </span>
            </>
          ) : (
            <span className="block truncate text-xs text-ink-muted">{tRates("noData")}</span>
          )}
        </span>
      </Link>
    </div>
  );
}
