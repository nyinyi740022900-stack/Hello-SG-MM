import { COUNTRIES } from "@/lib/countries";

/**
 * International SGD rates, from the free keyless exchangerate-api feed.
 *
 * For the rupee, yuan, taka and ringgit this is the rate the world actually
 * trades at: a remitter's rate sits just under it, and the gap is fees a
 * reader can reason about. Those four are safe to show directly.
 *
 * The kyat is not here, and that is deliberate. Every mainstream feed — this
 * one, Wise, XE, the Central Bank of Myanmar — reports roughly 1,650 MMK per
 * SGD, while money changers and remittance services deal near 3,250. The gap
 * is not a spread, it is a different market, and no public API publishes the
 * one people actually use (the single community feed that did has been frozen
 * since June 2024). Printing 1,650 would tell a worker their family receives
 * half what they will, so we print nothing here and take MMK from observed
 * readings in `exchange_rates` instead.
 */

const ENDPOINT = "https://open.er-api.com/v6/latest/SGD";

/** The feed updates roughly daily; an hour of cache is plenty. */
const REVALIDATE_SECONDS = 3600;

/**
 * Currencies this feed may be shown for. MMK is excluded — see above. Anything
 * added here must be a currency whose published rate is close to what a reader
 * can actually transact at.
 */
export const FEED_CURRENCIES = COUNTRIES.map((c) => c.currency).filter(
  (currency) => currency !== "MMK",
);

export function isFeedCurrency(currency: string): boolean {
  return FEED_CURRENCIES.includes(currency);
}

export type MarketRate = {
  currency: string;
  rate: number;
  /** When the upstream feed last refreshed, not when we fetched it. */
  updatedAt: string | null;
};

type FeedPayload = {
  result?: string;
  rates?: Record<string, number>;
  time_last_update_utc?: string;
};

async function fetchFeed(): Promise<FeedPayload | null> {
  try {
    const response = await fetch(ENDPOINT, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as FeedPayload;
    return payload.result === "success" ? payload : null;
  } catch {
    // A missing rate strip is a small loss; a crashed home page is not.
    return null;
  }
}

/** One currency's international rate, or null when we should not show one. */
export async function getMarketRate(currency: string): Promise<MarketRate | null> {
  if (!isFeedCurrency(currency)) return null;

  const payload = await fetchFeed();
  const rate = payload?.rates?.[currency];
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    return null;
  }

  return { currency, rate, updatedAt: payload?.time_last_update_utc ?? null };
}

/** Every currency we may show a feed rate for, in the countries' own order. */
export async function getMarketRates(): Promise<MarketRate[]> {
  const payload = await fetchFeed();
  if (!payload?.rates) return [];

  const rates: MarketRate[] = [];
  for (const currency of FEED_CURRENCIES) {
    const rate = payload.rates[currency];
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) continue;
    rates.push({ currency, rate, updatedAt: payload.time_last_update_utc ?? null });
  }
  return rates;
}
