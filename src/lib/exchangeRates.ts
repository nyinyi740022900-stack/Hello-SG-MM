import { supabase } from "@/lib/supabase";

/**
 * Remittance rates are the highest-risk content in the app: a wrong number
 * costs someone real money. Two rules follow from that and are enforced here
 * and at every call site:
 *
 *  1. A rate is never shown without the time it was observed and where it came
 *     from, so a reader can judge how stale it is.
 *  2. A rate is always labelled indicative. We are quoting a public source, not
 *     making an offer, and the provider's actual rate at send time governs.
 *
 * Rates are auto-published rather than queued for approval: approving a number
 * daily is friction with no editorial value, and a stale rate is worse than a
 * clearly-labelled one. `is_visible` is the admin's kill switch for a reading
 * that turns out to be wrong.
 */

export type RateProvider = "kbzpay" | "wavepay" | "bank" | "market" | "other";

export type ExchangeRate = {
  id: string;
  pair: string;
  provider: RateProvider;
  rate: number;
  source_url: string | null;
  source_name: string | null;
  observed_at: string;
  note_en: string | null;
  note_my: string | null;
};

const RATE_COLUMNS =
  "id,pair,provider,rate,source_url,source_name,observed_at,note_en,note_my";

/** How old a reading may be before we stop showing it at all. */
const MAX_AGE_DAYS = 7;

/**
 * Latest visible reading per provider, newest first.
 *
 * Postgres `distinct on` is not expressible through the Supabase JS client, so
 * we pull a small recent window and reduce it here. Volume is a handful of
 * readings per day, so this stays cheap.
 */
export async function listLatestRates(
  pair = "SGD_MMK",
): Promise<{ data: ExchangeRate[] | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("exchange_rates")
    .select(RATE_COLUMNS)
    .eq("pair", pair)
    .eq("is_visible", true)
    .gte("observed_at", cutoff)
    .order("observed_at", { ascending: false })
    .limit(60)
    .returns<ExchangeRate[]>();

  if (error) {
    return { data: null, error: error.message };
  }

  // Rows arrive newest-first, so the first hit per provider is its latest.
  const latestByProvider = new Map<RateProvider, ExchangeRate>();
  for (const row of data ?? []) {
    if (!latestByProvider.has(row.provider)) {
      latestByProvider.set(row.provider, row);
    }
  }

  return { data: [...latestByProvider.values()], error: null };
}

/**
 * Latest visible reading per pair, for several pairs at once.
 *
 * The home page shows every country's rate, and calling `listLatestRates`
 * per currency meant five database round trips before the page could render —
 * six with the hero banner. One query returns the same data: volume here is a
 * handful of readings per day across all pairs, so a single recent window is
 * cheaper than five narrow ones.
 */
export async function listLatestRatesByPair(
  pairs: string[],
): Promise<Map<string, ExchangeRate>> {
  const latest = new Map<string, ExchangeRate>();
  if (!supabase || pairs.length === 0) return latest;

  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("exchange_rates")
    .select(RATE_COLUMNS)
    .in("pair", pairs)
    .eq("is_visible", true)
    .gte("observed_at", cutoff)
    .order("observed_at", { ascending: false })
    .limit(200)
    .returns<ExchangeRate[]>();

  if (error) return latest;

  // Newest-first, so the first row seen for a pair is its latest reading.
  for (const row of data ?? []) {
    if (!latest.has(row.pair)) latest.set(row.pair, row);
  }
  return latest;
}

/**
 * Format a rate for display, at a precision the currency actually needs.
 *
 * Decimals are chosen by magnitude rather than fixed, because the five
 * currencies here span three orders of magnitude. 1,655 MMK per SGD carries no
 * information after the decimal point, but 3.34 MYR rounded to whole numbers
 * becomes "3" — an 11% error presented as a rate. So small numbers keep two
 * decimals and large ones drop them.
 */
export function formatRate(rate: number, locale: string): string {
  const decimals = rate >= 1000 ? 0 : rate >= 100 ? 1 : 2;

  return new Intl.NumberFormat(locale === "my" ? "my-MM" : "en-SG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rate);
}

/**
 * Relative age of a reading ("2 hours ago"), which communicates staleness far
 * better than an absolute timestamp for something that moves daily.
 */
export function formatObservedAt(observedAt: string, locale: string): string {
  const then = new Date(observedAt).getTime();
  const diffMinutes = Math.round((then - Date.now()) / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale === "my" ? "my" : "en", {
    numeric: "auto",
  });

  const absMinutes = Math.abs(diffMinutes);
  if (absMinutes < 60) return rtf.format(diffMinutes, "minute");
  if (absMinutes < 60 * 24) return rtf.format(Math.round(diffMinutes / 60), "hour");
  return rtf.format(Math.round(diffMinutes / (60 * 24)), "day");
}
