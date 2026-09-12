import { NextRequest, NextResponse } from "next/server";
import { expireStaleListings } from "@/lib/listingQuotas.server";
import { logServerEvent } from "@/lib/serverLogger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Daily: flip published rooms/jobs past expires_at to status=expired. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    logServerEvent("error", "cron_listings_expire_misconfigured", {});
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    logServerEvent("warn", "cron_listings_expire_unauthorized", {});
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await expireStaleListings();
  if (result.error) {
    logServerEvent("error", "cron_listings_expire_failed", {
      reason: result.error,
      rooms: result.rooms,
      jobs: result.jobs,
    });
    return NextResponse.json({ status: "error", ...result }, { status: 500 });
  }

  logServerEvent("info", "cron_listings_expire_ok", {
    rooms: result.rooms,
    jobs: result.jobs,
  });
  return NextResponse.json({ status: "ok", ...result });
}
