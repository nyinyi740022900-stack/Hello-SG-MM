import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleContentSubmit, checkAgentAuth, errorResponse } from "@/lib/contentSubmit.server";

// Backwards-compatible alias. The deployed cloud research agent still posts
// to this route with the old news-only payload shape. Once the agent
// routine is updated to call /api/content/submit directly with the richer
// payload, this alias can be removed (tracked for Phase 4).

const legacySubmitSchema = z.object({
  category: z.enum(["mom_policy", "exchange_rate", "safety_scam", "community"]),
  titleEn: z.string().min(4).max(200),
  titleMy: z.string().min(4).max(200),
  bodyEn: z.string().min(10).max(2000),
  bodyMy: z.string().min(10).max(2000),
  sourceUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Authorize before touching the body, so an unauthenticated caller cannot
  // probe the payload shape through validation errors.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const authFailure = checkAgentAuth(request, "news_submit_alias", ip);
  if (authFailure) return authFailure;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  const parsed = legacySubmitSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid request body.";
    return errorResponse(firstError, 400);
  }

  // 'exchange_rate' widened into 'finance' in the new 8-category taxonomy.
  const category = parsed.data.category === "exchange_rate" ? "finance" : parsed.data.category;

  const forwardedRequest = new NextRequest(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({
      type: "news",
      category,
      priority: "normal",
      titleEn: parsed.data.titleEn,
      titleMy: parsed.data.titleMy,
      bodyEn: parsed.data.bodyEn,
      bodyMy: parsed.data.bodyMy,
      sourceUrl: parsed.data.sourceUrl,
    }),
  });

  return handleContentSubmit(forwardedRequest, "news_submit_alias");
}
