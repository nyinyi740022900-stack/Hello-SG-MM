import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { consumeRateLimit } from "@/lib/rateLimit";
import { logServerEvent } from "@/lib/serverLogger";

const submitSchema = z.object({
  category: z.enum(["mom_policy", "exchange_rate", "safety_scam", "community"]),
  titleEn: z.string().min(4).max(200),
  titleMy: z.string().min(4).max(200),
  bodyEn: z.string().min(10).max(2000),
  bodyMy: z.string().min(10).max(2000),
  sourceUrl: z.string().url().optional(),
});

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/news/submit
 *
 * Used by the automated daily research agent (not by browser clients) to
 * submit a candidate news item. Requires a shared-secret Bearer token
 * (AGENT_API_SECRET). Items are always created with status "pending" and
 * must be approved by an admin in /admin/news before they appear publicly.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

  const ipLimit = consumeRateLimit({
    key: `news-submit-ip:${ip}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipLimit.allowed) {
    return errorResponse("Too many submissions. Please try again later.", 429);
  }

  const agentSecret = process.env.AGENT_API_SECRET;
  if (!agentSecret) {
    return errorResponse("Server configuration error.", 500);
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${agentSecret}`) {
    logServerEvent("warn", "news_submit_unauthorized", { ip });
    return errorResponse("Unauthorized.", 401);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return errorResponse("Server configuration error.", 500);
  }

  let body: z.infer<typeof submitSchema>;
  try {
    const rawBody: unknown = await request.json();
    const parsed = submitSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid request body.";
      return errorResponse(firstError, 400);
    }
    body = parsed.data;
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase
    .from("news_items")
    .insert({
      category: body.category,
      title_en: body.titleEn,
      title_my: body.titleMy,
      body_en: body.bodyEn,
      body_my: body.bodyMy,
      source_url: body.sourceUrl ?? null,
      status: "pending",
      created_by: "agent",
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    logServerEvent("error", "news_submit_failed", { ip, reason: error.message });
    return errorResponse("Failed to save news item.", 500);
  }

  logServerEvent("info", "news_submit_success", { ip, newsItemId: data.id });

  return NextResponse.json({ status: "ok", id: data.id, note: "Pending admin approval." });
}
