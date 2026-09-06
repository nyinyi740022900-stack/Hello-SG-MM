import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { consumeRateLimit } from "@/lib/rateLimit";
import { logServerEvent } from "@/lib/serverLogger";
import { routing } from "@/i18n/routing";

/**
 * Reader-reported translation problems.
 *
 * Deliberately open to anonymous callers: the readers most able to spot a bad
 * Tamil or Bengali translation are the least likely to have made an account,
 * and requiring one would close the only channel we have for that signal.
 * Abuse is handled by rate limiting and by the fact that reports are private
 * and advisory — nothing here changes what readers see.
 */

const reportSchema = z.object({
  locale: z.enum(routing.locales as unknown as [string, ...string[]]),
  pagePath: z.string().min(1).max(300),
  contentItemId: z.string().uuid().optional(),
  note: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const limit = consumeRateLimit({
    key: `translation-report:${ip}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many reports. Try again later." }, { status: 429 });
  }

  let body: z.infer<typeof reportSchema>;
  try {
    const parsed = reportSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid report." }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { error } = await supabase.from("translation_reports").insert({
    locale: body.locale,
    page_path: body.pagePath,
    content_item_id: body.contentItemId ?? null,
    note: body.note?.trim() || null,
  });

  if (error) {
    logServerEvent("error", "translation_report_failed", { ip, reason: error.message });
    return NextResponse.json({ error: "Could not save report." }, { status: 500 });
  }

  logServerEvent("info", "translation_report_received", { ip, locale: body.locale });
  return NextResponse.json({ status: "ok" });
}
