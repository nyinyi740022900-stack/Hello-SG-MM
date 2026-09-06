import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CONTENT_CATEGORIES, type ContentCategory } from "@/lib/content";
import { checkAgentAuth, errorResponse } from "@/lib/contentSubmit.server";
import { logServerEvent } from "@/lib/serverLogger";

const RECENT_ITEMS_LIMIT = 40;
const COVERAGE_WINDOW_DAYS = 14;

type RecentItemRow = {
  title_en: string;
  category: ContentCategory;
  source_url: string | null;
  status: string;
  published_at: string | null;
};

type CategoryCoverage = {
  category: ContentCategory;
  publishedLast14Days: number;
  lastPublishedAt: string | null;
};

/**
 * GET /api/agent/brief handler.
 *
 * Gives the cloud research agent (which has no access to this repo) a
 * snapshot of what the portal already knows: recent submissions (any
 * status, so it can dedupe against pending/rejected items too) plus a
 * per-category publish-rate readout so it knows which topics are running
 * dry today.
 */
export async function handleAgentBrief(request: NextRequest): Promise<NextResponse> {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

  const authFailure = checkAgentAuth(request, "agent_brief", ip);
  if (authFailure) return authFailure;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return errorResponse("Server configuration error.", 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const [recentResult, coverageResult] = await Promise.all([
      supabase
        .from("content_items")
        .select("title_en,category,source_url,status,published_at")
        .order("created_at", { ascending: false })
        .limit(RECENT_ITEMS_LIMIT)
        .returns<RecentItemRow[]>(),
      supabase
        .from("content_items")
        .select("category,published_at")
        .eq("status", "published")
        .returns<{ category: ContentCategory; published_at: string | null }[]>(),
    ]);

    if (recentResult.error) {
      logServerEvent("error", "agent_brief_failed", { ip, reason: recentResult.error.message });
      return errorResponse("Failed to load recent content items.", 500);
    }
    if (coverageResult.error) {
      logServerEvent("error", "agent_brief_failed", { ip, reason: coverageResult.error.message });
      return errorResponse("Failed to load category coverage.", 500);
    }

    const recentRows = recentResult.data ?? [];
    const publishedRows = coverageResult.data ?? [];

    const recentItems = recentRows.map((row) => ({
      title: row.title_en,
      category: row.category,
      sourceUrl: row.source_url,
      status: row.status,
      publishedAt: row.published_at,
    }));

    const knownSourceUrls = Array.from(
      new Set(recentRows.map((row) => row.source_url).filter((url): url is string => Boolean(url))),
    );

    const windowStart = new Date(Date.now() - COVERAGE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const categoryCoverage: CategoryCoverage[] = CONTENT_CATEGORIES.map((category) => {
      const rowsForCategory = publishedRows.filter((row) => row.category === category);

      const publishedLast14Days = rowsForCategory.filter((row) => {
        if (!row.published_at) return false;
        return new Date(row.published_at) >= windowStart;
      }).length;

      const lastPublishedAt = rowsForCategory.reduce<string | null>((latest, row) => {
        if (!row.published_at) return latest;
        if (!latest || new Date(row.published_at) > new Date(latest)) return row.published_at;
        return latest;
      }, null);

      return { category, publishedLast14Days, lastPublishedAt };
    });

    const staleCategories = categoryCoverage
      .filter((entry) => entry.publishedLast14Days === 0)
      .map((entry) => entry.category);

    logServerEvent("info", "agent_brief_success", { ip, recentItemCount: recentItems.length });

    const response = NextResponse.json({
      generatedAt: new Date().toISOString(),
      categories: CONTENT_CATEGORIES,
      recentItems,
      knownSourceUrls,
      categoryCoverage,
      staleCategories,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (err) {
    logServerEvent("error", "agent_brief_failed", {
      ip,
      reason: err instanceof Error ? err.message : "unknown error",
    });
    return errorResponse("Failed to build agent brief.", 500);
  }
}
