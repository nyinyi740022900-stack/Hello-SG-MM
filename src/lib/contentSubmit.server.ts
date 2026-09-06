import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { consumeRateLimit } from "@/lib/rateLimit";
import { logServerEvent } from "@/lib/serverLogger";
import { generateSlug } from "@/lib/content";

export const contentSubmitSchema = z.object({
  type: z.enum(["news", "event", "directory"]).default("news"),
  category: z.enum([
    "mom_policy",
    "embassy",
    "safety_scam",
    "finance",
    "legal",
    "health",
    "community",
    "education",
  ]),
  priority: z.enum(["urgent", "high", "normal"]).default("normal"),
  titleEn: z.string().min(4).max(200),
  titleMy: z.string().min(4).max(200),
  summaryEn: z.string().max(500).optional(),
  summaryMy: z.string().max(500).optional(),
  bodyEn: z.string().min(10).max(2000),
  bodyMy: z.string().min(10).max(2000),
  sourceUrl: z.string().url().optional(),
  sourceName: z.string().max(120).optional(),
  sourcePublishedAt: z.string().optional(),
  // type = 'event'
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  locationName: z.string().max(200).optional(),
  address: z.string().max(300).optional(),
  // type = 'directory'
  phone: z.string().max(60).optional(),
  website: z.string().url().optional(),
  openingHours: z.string().max(300).optional(),
  languages: z.array(z.string()).optional(),
  isFree: z.boolean().optional(),
});

export type ContentSubmitBody = z.infer<typeof contentSubmitSchema>;

export function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Shared handler for agent content submissions. Requires a shared-secret
 * Bearer token (AGENT_API_SECRET). Items are always created with status
 * "pending" and must be approved by an admin before they appear publicly.
 *
 * `eventName` distinguishes the caller in rate-limit keys and logs so the
 * legacy /api/news/submit alias and the canonical /api/content/submit route
 * can share this logic without colliding.
 */
/**
 * Verify the caller is the research agent. Callers must run this BEFORE
 * parsing or validating the body, so an unauthenticated caller cannot probe
 * the payload schema through validation error messages.
 *
 * Returns an error response to send back, or null when authorized.
 */
export function checkAgentAuth(
  request: NextRequest,
  eventName: string,
  ip: string,
): NextResponse | null {
  const agentSecret = process.env.AGENT_API_SECRET;
  if (!agentSecret) {
    return errorResponse("Server configuration error.", 500);
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${agentSecret}`) {
    logServerEvent("warn", `${eventName}_unauthorized`, { ip });
    return errorResponse("Unauthorized.", 401);
  }

  return null;
}

export async function handleContentSubmit(
  request: NextRequest,
  eventName: string,
): Promise<NextResponse> {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

  const ipLimit = consumeRateLimit({
    key: `content-submit-ip:${ip}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipLimit.allowed) {
    return errorResponse("Too many submissions. Please try again later.", 429);
  }

  const authFailure = checkAgentAuth(request, eventName, ip);
  if (authFailure) return authFailure;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return errorResponse("Server configuration error.", 500);
  }

  let body: ContentSubmitBody;
  try {
    const rawBody: unknown = await request.json();
    const parsed = contentSubmitSchema.safeParse(rawBody);
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
    .from("content_items")
    .insert({
      type: body.type,
      category: body.category,
      priority: body.priority,
      slug: generateSlug(body.titleEn),
      title_en: body.titleEn,
      title_my: body.titleMy,
      summary_en: body.summaryEn ?? null,
      summary_my: body.summaryMy ?? null,
      body_en: body.bodyEn,
      body_my: body.bodyMy,
      source_url: body.sourceUrl ?? null,
      source_name: body.sourceName ?? null,
      source_published_at: body.sourcePublishedAt ?? null,
      starts_at: body.startsAt ?? null,
      ends_at: body.endsAt ?? null,
      location_name: body.locationName ?? null,
      address: body.address ?? null,
      phone: body.phone ?? null,
      website: body.website ?? null,
      opening_hours: body.openingHours ?? null,
      languages: body.languages ?? null,
      is_free: body.isFree ?? null,
      status: "pending",
      created_by: "agent",
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    // Unique violation. Two different indexes can raise this, so say which —
    // a duplicate source is the expected, meaningful case for the agent, while
    // a slug clash is a rare accident it should retry rather than skip.
    if (error.code === "23505") {
      logServerEvent("warn", `${eventName}_duplicate`, { ip, reason: error.message });
      if (error.message.includes("slug")) {
        return errorResponse(
          "Slug collision — retry the submission to get a new slug.",
          409,
        );
      }
      return errorResponse("Already submitted: this source URL is already in the feed.", 409);
    }
    logServerEvent("error", `${eventName}_failed`, { ip, reason: error.message });
    return errorResponse("Failed to save content item.", 500);
  }

  logServerEvent("info", `${eventName}_success`, { ip, contentItemId: data.id });

  return NextResponse.json({ status: "ok", id: data.id, note: "Pending admin approval." });
}
