import { createClient } from "@supabase/supabase-js";
import { COUNTRIES, type CountryCode } from "@/lib/countries";
import { logServerEvent } from "@/lib/serverLogger";

/**
 * Records one reference reading per currency into `exchange_rates`.
 *
 * Which currencies, and why not all of them
 * ------------------------------------------
 * The feed here publishes official mid-market rates. For the rupee, yuan,
 * taka and ringgit that number is a fair reference: what a licensed remitter
 * actually pays sits a little under it, and the gap is fees a reader can
 * reason about.
 *
 * The kyat is different in kind, not degree. Myanmar's official rate is fixed
 * far away from the rate money changers and remittance services transact at —
 * often close to half. Storing it in this table would put it beside genuinely
 * transactable readings under the same heading, and a worker doing the
 * arithmetic would conclude their family receives half what they will. So MMK
 * is excluded here by design; it is surfaced separately and explicitly
 * labelled the official rate (see lib/fxRate.ts). If we ever get a real
 * observed street rate it goes in as its own provider, not as this one.
 */
const ENDPOINT = "https://open.er-api.com/v6/latest/SGD";

/** Currencies whose official rate is close enough to be a useful reference. */
const SYNCED_COUNTRIES: CountryCode[] = ["in", "cn", "bd", "my"];

const SOURCE_NAME = "exchangerate-api.com (mid-market)";
const SOURCE_URL = "https://www.exchangerate-api.com/";

export type RateSyncResult = {
  inserted: number;
  skipped: string[];
  errors: string[];
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function syncExchangeRates(): Promise<RateSyncResult> {
  const result: RateSyncResult = { inserted: 0, skipped: [], errors: [] };

  const db = adminClient();
  if (!db) {
    result.errors.push("Supabase service role is not configured.");
    return result;
  }

  let payload: {
    result?: string;
    rates?: Record<string, number>;
    time_last_update_unix?: number;
  };

  try {
    const response = await fetch(ENDPOINT, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      result.errors.push(`Feed responded ${response.status}.`);
      return result;
    }
    payload = await response.json();
  } catch (error) {
    logServerEvent("error", "rate_sync_fetch_failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    result.errors.push("Could not reach the exchange rate feed.");
    return result;
  }

  if (payload.result !== "success" || !payload.rates) {
    result.errors.push("Feed returned an unsuccessful payload.");
    return result;
  }

  // The feed's own refresh time, not ours. A reader judging staleness needs to
  // know when the number was true, not when our cron happened to run.
  const observedAt = payload.time_last_update_unix
    ? new Date(payload.time_last_update_unix * 1000).toISOString()
    : new Date().toISOString();

  const rows = [];
  for (const code of SYNCED_COUNTRIES) {
    const country = COUNTRIES.find((c) => c.code === code);
    if (!country) continue;

    const rate = payload.rates[country.currency];
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      result.skipped.push(`${country.currency}: no usable rate in feed`);
      continue;
    }

    rows.push({
      pair: `SGD_${country.currency}`,
      provider: "market" as const,
      rate,
      source_url: SOURCE_URL,
      source_name: SOURCE_NAME,
      observed_at: observedAt,
      note_en:
        "Official mid-market reference rate. Your provider's rate after fees will be lower.",
    });
  }

  if (rows.length === 0) {
    return result;
  }

  // A unique index covers (pair, provider, observed_at), so re-running before
  // the feed refreshes is a no-op rather than a duplicate reading.
  const { data, error } = await db
    .from("exchange_rates")
    .upsert(rows, {
      onConflict: "pair,provider,observed_at",
      ignoreDuplicates: true,
    })
    .select("id");

  if (error) {
    logServerEvent("error", "rate_sync_insert_failed", { reason: error.message });
    result.errors.push(error.message);
    return result;
  }

  result.inserted = data?.length ?? 0;
  return result;
}
