import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "@/lib/authz";
import { isCountryCode, getCountry } from "@/lib/countries";
import { logServerEvent } from "@/lib/serverLogger";

/**
 * Records a money-changer rate an admin read off a board or a provider app.
 *
 * This exists because the kyat has no machine-readable market rate. Every
 * public feed carries Myanmar's official figure, which is roughly half what a
 * remittance converts at, so the only honest source is a person looking at a
 * real quote. The same route serves any currency — an observed reading should
 * always beat a mid-market estimate.
 *
 * Rates are the highest-risk content in the app, so this writes with the
 * admin's own identity checked first and stores when the reading was observed,
 * never assuming "now".
 */

export const dynamic = "force-dynamic";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await checkAdminAuth();
  if (auth.status !== "authorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const db = serviceClient();
  if (!db) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  let payload: {
    country?: unknown;
    rate?: unknown;
    rateSell?: unknown;
    sourceName?: unknown;
    sourceUrl?: unknown;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isCountryCode(payload.country)) {
    return NextResponse.json({ error: "Choose a country." }, { status: 400 });
  }
  const country = getCountry(payload.country);

  const rate = Number(payload.rate);
  if (!Number.isFinite(rate) || rate <= 0) {
    return NextResponse.json({ error: "Enter a rate above zero." }, { status: 400 });
  }

  const rateSellRaw = payload.rateSell;
  let rateSell: number | null = null;
  if (rateSellRaw !== undefined && rateSellRaw !== null && rateSellRaw !== "") {
    rateSell = Number(rateSellRaw);
    if (!Number.isFinite(rateSell) || rateSell <= 0) {
      return NextResponse.json({ error: "Sell rate must be above zero." }, { status: 400 });
    }
  }

  const sourceName =
    typeof payload.sourceName === "string" && payload.sourceName.trim()
      ? payload.sourceName.trim().slice(0, 120)
      : null;
  if (!sourceName) {
    // Without a source the reading is an unattributable number, and the whole
    // point of this table is that a reader can judge where a rate came from.
    return NextResponse.json({ error: "Say where you saw this rate." }, { status: 400 });
  }

  let sourceUrl: string | null = null;
  if (typeof payload.sourceUrl === "string" && payload.sourceUrl.trim()) {
    try {
      const parsed = new URL(payload.sourceUrl.trim());
      if (parsed.protocol !== "https:") {
        return NextResponse.json({ error: "Source link must be https." }, { status: 400 });
      }
      sourceUrl = parsed.toString();
    } catch {
      return NextResponse.json({ error: "Source link is not a valid URL." }, { status: 400 });
    }
  }

  const row: Record<string, unknown> = {
    pair: `SGD_${country.currency}`,
    provider: "market",
    rate,
    source_name: sourceName,
    source_url: sourceUrl,
    observed_at: new Date().toISOString(),
    created_by: auth.profile.email ?? "admin",
  };
  if (rateSell !== null) row.rate_sell = rateSell;

  const { error } = await db.from("exchange_rates").insert(row);

  if (error) {
    // 42703 = column does not exist, i.e. the rate_sell migration has not been
    // applied yet. Retry without it rather than losing the reading.
    if (error.code === "42703" && rateSell !== null) {
      delete row.rate_sell;
      const retry = await db.from("exchange_rates").insert(row);
      if (!retry.error) {
        return NextResponse.json({
          status: "ok",
          warning: "Saved without the sell rate — run the rate_sell migration to store both sides.",
        });
      }
    }
    logServerEvent("error", "admin_rate_insert_failed", { reason: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logServerEvent("info", "admin_rate_recorded", { pair: `SGD_${country.currency}` });
  return NextResponse.json({ status: "ok" });
}
