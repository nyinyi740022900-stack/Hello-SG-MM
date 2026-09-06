/**
 * Official mid-market SGD→MMK, from the free keyless exchangerate-api feed.
 *
 * A warning that has to travel with every use of this number: for MMK the
 * official rate and the rate people actually transact at are far apart. At the
 * time of writing this feed reports roughly 1,650 MMK per SGD, while money
 * changers and remittance providers deal nearer 3,000+. Every mainstream
 * source — XE, Wise, Bloomberg, the Central Bank — reports the official
 * figure, because the market rate is informal and no one publishes an API for
 * it.
 *
 * So this is shown as a reference point and labelled as the official rate, and
 * never as what a reader will receive. Presenting it as "the" rate would tell
 * someone their remittance is worth half what it is.
 *
 * Rates people can actually get are recorded separately in `exchange_rates`,
 * with the provider and the time each reading was observed.
 */

const ENDPOINT = "https://open.er-api.com/v6/latest/SGD";

/** The feed updates roughly daily; an hour of cache is plenty. */
const REVALIDATE_SECONDS = 3600;

export type MidMarketRate = {
  quote: string;
  rate: number;
  /** When the upstream feed last refreshed, not when we fetched it. */
  updatedAt: string | null;
};

export async function getMidMarketRate(
  quote = "MMK",
): Promise<MidMarketRate | null> {
  try {
    const response = await fetch(ENDPOINT, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as {
      result?: string;
      rates?: Record<string, number>;
      time_last_update_utc?: string;
    };

    if (payload.result !== "success") return null;

    const rate = payload.rates?.[quote];
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      return null;
    }

    return {
      quote,
      rate,
      updatedAt: payload.time_last_update_utc ?? null,
    };
  } catch {
    // A missing rate strip is a small loss; a crashed home page is not.
    return null;
  }
}
