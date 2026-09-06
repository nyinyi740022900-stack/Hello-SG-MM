import { NextRequest, NextResponse } from "next/server";
import { handleAgentBrief } from "@/lib/agentBrief.server";

// The dedupe list must always be current, never cached at the edge or by
// Next's data cache.
export const dynamic = "force-dynamic";

/**
 * GET /api/agent/brief
 *
 * Called by the cloud research agent before it starts a run. The agent has
 * no access to this repo, so this is how it learns what the portal already
 * has (to dedupe) and which categories are running dry (to prioritize).
 * Requires the same shared-secret Bearer token as /api/content/submit.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleAgentBrief(request);
}
