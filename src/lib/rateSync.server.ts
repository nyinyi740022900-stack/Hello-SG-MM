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

/**
 * A daily reading of the kyat's street rate, from an independent aggregator.
 *
 * This is the "real observed street rate" the comment above promised: EG
 * Currency publishes buy/sell figures for SGD/MMK in plain server-rendered
 * HTML, refreshed daily, which is more than any bank or e-wallet in this
 * corridor offers publicly.
 *
 * It is recorded with real reservations, and those reservations are stored
 * alongside the number, not silently assumed away:
 *
 *  - The site discloses no methodology and its policy pages do not resolve,
 *    so there is no way to independently confirm how the figure is derived.
 *  - Its buy/sell ordering does not match a standard dealer board (buy came
 *    out higher than sell on inspection), which is either a different
 *    convention or a data quality issue we cannot tell apart from outside.
 *  - It reads noticeably higher than the one number we manually verified
 *    against a real remittance quote (Western Union, ~3,159 at the same
 *    time this was checked).
 *
 * So it is stored under provider "other", not "market" — the four
 * currencies under "market" come from a clean official mid-market feed, and
 * grouping this beside them would borrow a confidence it has not earned.
 * `is_visible` remains the kill switch if it turns out to be wrong.
 */
const EG_CURRENCY_URL = "https://egcurrency.com/en/currency/MMK/blackMarket";
/** Datacenter IPs (including Vercel) often get 403 from EG Currency directly. */
const EG_CURRENCY_READER_URL = `https://r.jina.ai/http://egcurrency.com/en/currency/MMK/blackMarket`;
const EG_CURRENCY_NOTE_EN =
  "From an independent rate-tracking site, not a bank or licensed remitter. " +
  "Its methodology is not published and could not be independently confirmed. " +
  "Treat as a rough indication only, and confirm the real rate in your provider's own app before you send.";
const EG_CURRENCY_NOTE_MY =
  "ဘဏ် သို့မဟုတ် လိုင်စင်ရ ငွေလွှဲကုမ္ပဏီ မဟုတ်ဘဲ သီးခြား ငွေလဲနှုန်း မှတ်တမ်းတင် site တစ်ခုမှ ရယူထားပါသည်။ " +
  "ထိုနှုန်း ဘယ်လို တွက်ချက်သည်ကို site က ထုတ်ဖော်မထားပြီး သီးခြား အတည်ပြု၍ မရပါ။ " +
  "ခန့်မှန်းချက်အနေဖြင့်သာ သတ်မှတ်ပြီး ငွေမပို့မီ သင့်ဝန်ဆောင်မှုပေးသူ၏ app တွင် တကယ့်နှုန်းကို အတည်ပြုပါ။";

const EG_FETCH_HEADERS = {
  accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "user-agent":
    "Mozilla/5.0 (compatible; MyanmarGlobalHubRates/1.0; +https://sg-migrant-worker-app.vercel.app)",
};

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

/**
 * Parse the SGD row out of EG Currency's server-rendered MMK page.
 *
 * No API is offered, so this reads the same static HTML markup a browser
 * would — a `<td class="text-danger">` pair immediately after the row whose
 * link text names Singapore Dollar. Deliberately narrow: if the site changes
 * its markup this returns null rather than guessing, so a broken parse fails
 * closed instead of inserting whatever number happens to be nearby.
 */
function parseSgdMmkHtml(html: string): { buy: number; sell: number } | null {
  const anchor = html.indexOf("Singapore Dollar");
  if (anchor === -1) return null;

  const window = html.slice(anchor, anchor + 600);
  const cells = [...window.matchAll(/class="text-danger">([\d,]+\.\d+)</g)];
  if (cells.length < 2) return null;

  return sanitizeSgdMmkPair(cells[0][1], cells[1][1]);
}

/**
 * Same numbers via the Jina reader markdown table used when EG Currency
 * blocks the direct request (common from cloud datacenter IPs).
 */
function parseSgdMmkMarkdown(md: string): { buy: number; sell: number } | null {
  const match = md.match(
    /Singapore Dollar[^\n]*?\|\s*([\d,]+\.\d+)\s*\|\s*([\d,]+\.\d+)/i,
  );
  if (!match) return null;
  return sanitizeSgdMmkPair(match[1], match[2]);
}

function sanitizeSgdMmkPair(
  buyRaw: string,
  sellRaw: string,
): { buy: number; sell: number } | null {
  const buy = Number(buyRaw.replace(/,/g, ""));
  const sell = Number(sellRaw.replace(/,/g, ""));
  if (!Number.isFinite(buy) || !Number.isFinite(sell) || buy <= 0 || sell <= 0) {
    return null;
  }

  // A currency-conversion sanity bound, not a claim about the true rate: it
  // exists only to reject a parse that landed on the wrong number entirely
  // (a different currency's row, a percentage, a stray figure), while still
  // accepting whatever this volatile corridor's real rate turns out to be.
  if (buy < 500 || buy > 20_000 || sell < 500 || sell > 20_000) return null;

  return { buy, sell };
}

async function fetchEgCurrencyBody(): Promise<
  { kind: "html" | "markdown"; body: string } | { error: string }
> {
  try {
    const direct = await fetch(EG_CURRENCY_URL, {
      cache: "no-store",
      headers: EG_FETCH_HEADERS,
    });
    if (direct.ok) {
      return { kind: "html", body: await direct.text() };
    }
    logServerEvent("warn", "mmk_street_rate_direct_blocked", {
      reason: `status_${direct.status}`,
    });
  } catch (error) {
    logServerEvent("warn", "mmk_street_rate_direct_failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
  }

  try {
    const reader = await fetch(EG_CURRENCY_READER_URL, {
      cache: "no-store",
      headers: { ...EG_FETCH_HEADERS, accept: "text/plain" },
    });
    if (!reader.ok) {
      return { error: `EG Currency reader responded ${reader.status}.` };
    }
    return { kind: "markdown", body: await reader.text() };
  } catch (error) {
    logServerEvent("error", "mmk_street_rate_fetch_failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    return { error: "Could not reach EG Currency." };
  }
}

export async function syncMmkStreetRate(): Promise<RateSyncResult> {
  const result: RateSyncResult = { inserted: 0, skipped: [], errors: [] };

  const db = adminClient();
  if (!db) {
    result.errors.push("Supabase service role is not configured.");
    return result;
  }

  const fetched = await fetchEgCurrencyBody();
  if ("error" in fetched) {
    result.errors.push(fetched.error);
    return result;
  }

  const parsed =
    fetched.kind === "html"
      ? parseSgdMmkHtml(fetched.body)
      : parseSgdMmkMarkdown(fetched.body);
  if (!parsed) {
    result.skipped.push("SGD/MMK row not found or out of bounds on EG Currency");
    return result;
  }

  const { error: insertError } = await db.from("exchange_rates").insert({
    pair: "SGD_MMK",
    provider: "other",
    rate: parsed.buy,
    rate_sell: parsed.sell,
    source_url: EG_CURRENCY_URL,
    source_name: "EG Currency",
    observed_at: new Date().toISOString(),
    note_en: EG_CURRENCY_NOTE_EN,
    note_my: EG_CURRENCY_NOTE_MY,
  });

  if (insertError) {
    // 23505: the unique index on (pair, provider, observed_at) — harmless,
    // just means this has already run once for this exact timestamp.
    if (insertError.code !== "23505") {
      logServerEvent("error", "mmk_street_rate_insert_failed", {
        reason: insertError.message,
      });
      result.errors.push(insertError.message);
    }
    return result;
  }

  result.inserted = 1;
  return result;
}
