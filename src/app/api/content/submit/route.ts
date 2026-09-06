import { NextRequest, NextResponse } from "next/server";
import { handleContentSubmit } from "@/lib/contentSubmit.server";

/**
 * POST /api/content/submit
 *
 * Canonical endpoint for the automated daily research agent (not browser
 * clients) to submit a candidate content item (news, event, or directory
 * entry). Requires a shared-secret Bearer token (AGENT_API_SECRET). Items
 * are always created with status "pending" and must be approved by an
 * admin in /admin/news before they appear publicly.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleContentSubmit(request, "content_submit");
}
