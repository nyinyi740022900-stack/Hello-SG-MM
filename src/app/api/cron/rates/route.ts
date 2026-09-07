import { NextRequest, NextResponse } from "next/server";
import { syncExchangeRates, syncMmkStreetRate } from "@/lib/rateSync.server";
import { logServerEvent } from "@/lib/serverLogger";

/**
 * Records the day's reference exchange rates.
 *
 * Unlike the research cron this needs no model and no approval queue: it
 * copies published numbers verbatim, and a number is either fetched correctly
 * or not fetched at all. See lib/rateSync.server.ts for which currencies are
 * synced and why the kyat is not one of them.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    logServerEvent("error", "cron_rates_misconfigured", {});
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    logServerEvent("warn", "cron_rates_unauthorized", {});
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Two independent sources, kept as two calls: a parsing failure on the
  // MMK side must never stop the four currencies that already work from
  // updating, and vice versa.
  const [feed, mmkStreet] = await Promise.all([syncExchangeRates(), syncMmkStreetRate()]);

  const combined = {
    inserted: feed.inserted + mmkStreet.inserted,
    skipped: [...feed.skipped, ...mmkStreet.skipped],
    errors: [...feed.errors, ...mmkStreet.errors],
    feed,
    mmkStreet,
  };

  if (feed.errors.length > 0 || mmkStreet.errors.length > 0) {
    logServerEvent("error", "cron_rates_failed", {
      reason: combined.errors.join("; "),
    });
    return NextResponse.json({ status: "error", ...combined }, { status: 500 });
  }

  logServerEvent("info", "cron_rates_ok", { inserted: combined.inserted });
  return NextResponse.json({ status: "ok", ...combined });
}
