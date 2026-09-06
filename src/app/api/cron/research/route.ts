import { NextRequest, NextResponse } from "next/server";
import { runDailyResearch } from "@/lib/research.server";
import { logServerEvent } from "@/lib/serverLogger";

/**
 * Daily content research, triggered by Vercel Cron.
 *
 * Research runs here rather than in a scheduled cloud agent because that
 * environment's egress policy blocks this host, so the agent could never reach
 * the submit API. Everything this produces still lands as `pending` and needs
 * admin approval — the human gate is unchanged.
 */

export const dynamic = "force-dynamic";
/** Research does several web-search round trips; give it room. */
export const maxDuration = 300;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Vercel Cron sends CRON_SECRET as a bearer token. Requiring it keeps the
  // endpoint from being run — and billed — by anyone who finds the URL.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    logServerEvent("error", "cron_research_misconfigured", {});
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    logServerEvent("warn", "cron_research_unauthorized", {});
    return unauthorized();
  }

  // Stop starting new work with time left to finish the in-flight category.
  const budgetMs = Math.max(30_000, (maxDuration - 45) * 1000);

  const { summary, error } = await runDailyResearch(budgetMs);

  if (error) {
    logServerEvent("error", "cron_research_failed", { reason: error });
    return NextResponse.json({ status: "error", error }, { status: 500 });
  }

  return NextResponse.json({ status: "ok", summary });
}
