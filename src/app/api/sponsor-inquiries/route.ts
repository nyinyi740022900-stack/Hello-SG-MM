import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { consumeRateLimit } from "@/lib/rateLimit";
import { logServerEvent } from "@/lib/serverLogger";

const sponsorInquirySchema = z.object({
  name: z.string().min(2).max(120),
  organization: z.string().min(2).max(180),
  email: z.string().email().max(255),
  phone: z.string().max(40).optional(),
  message: z.string().min(10).max(1000),
  website: z.string().optional(), // honeypot
});

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const rawBody: unknown = await request.json().catch(() => null);
  const parsed = sponsorInquirySchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonError("Invalid request body.");
  }

  // Honeypot field should stay empty for real users.
  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    return NextResponse.json({ ok: true }, { status: 202 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rate = consumeRateLimit({
    key: `sponsor-inquiry:${ip}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rate.allowed) {
    return jsonError("Too many submissions. Please try again later.", 429);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonError("Server configuration error.", 500);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await supabase.from("sponsor_inquiries").insert({
    name: parsed.data.name,
    organization: parsed.data.organization,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    message: parsed.data.message,
  });

  if (error) {
    logServerEvent("error", "sponsor_inquiry_insert_failed", {
      ip,
      reason: error.message,
    });
    return jsonError("Failed to submit inquiry.", 500);
  }

  logServerEvent("info", "sponsor_inquiry_submitted", { ip });
  return NextResponse.json({ ok: true }, { status: 200 });
}
