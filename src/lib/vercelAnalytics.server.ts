/**
 * Server-only client for Vercel's Web Analytics REST API.
 *
 * Requires VERCEL_TOKEN (an Access Token from the Vercel dashboard) and
 * VERCEL_PROJECT_ID as server environment variables. Neither is public —
 * this file must only ever be imported from a Route Handler / Server
 * Component, never from client code.
 */

const VERCEL_ANALYTICS_COUNT_URL =
  "https://api.vercel.com/v1/query/web-analytics/visits/count";

export type VisitorsKpi = {
  visitors: number;
  pageviews: number;
};

export async function fetchVisitorsKpi(range: {
  startDate: string;
  endDate: string;
}): Promise<{ data: VisitorsKpi | null; error: string | null }> {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    return { data: null, error: "not_configured" };
  }

  // Vercel's API silently rounds `until` down to that day's 00:00:00Z rather
  // than treating it as an inclusive end-of-day bound, which was excluding
  // the whole final day (usually "today") from every range. Passing the day
  // AFTER endDate as an exclusive upper bound includes all of endDate.
  const since = new Date(`${range.startDate}T00:00:00.000Z`).toISOString();
  const untilExclusive = new Date(`${range.endDate}T00:00:00.000Z`);
  untilExclusive.setUTCDate(untilExclusive.getUTCDate() + 1);
  const until = untilExclusive.toISOString();

  const params = new URLSearchParams({ projectId, since, until });

  try {
    const res = await fetch(`${VERCEL_ANALYTICS_COUNT_URL}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[vercelAnalytics] API error ${res.status}: ${body.slice(0, 500)}`);
      return { data: null, error: `Vercel Analytics API error (${res.status}).` };
    }

    const json = (await res.json()) as {
      data?: { visitors?: number; pageviews?: number };
    };

    return {
      data: {
        visitors: json.data?.visitors ?? 0,
        pageviews: json.data?.pageviews ?? 0,
      },
      error: null,
    };
  } catch {
    return { data: null, error: "Could not reach Vercel Analytics API." };
  }
}
