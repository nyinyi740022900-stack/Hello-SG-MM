import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/authz";
import { consumeRateLimit } from "@/lib/rateLimit";
import { logServerEvent } from "@/lib/serverLogger";
import { JOB_MESSAGE_COLUMNS } from "@/lib/jobListings";

export const dynamic = "force-dynamic";

const postSchema = z.object({
  applicationId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

/** List messages for an application (applicant or job poster). */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const applicationId = request.nextUrl.searchParams.get("applicationId");
  if (!applicationId || !z.string().uuid().safeParse(applicationId).success) {
    return NextResponse.json({ error: "Invalid application." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("job_messages")
    .select(JOB_MESSAGE_COLUMNS)
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    logServerEvent("error", "job_messages_list_failed", { message: error.message });
    return NextResponse.json({ error: "Could not load messages." }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}

/** Send a message on an application thread. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const limit = consumeRateLimit({
    key: `job-message:${user.id}`,
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many messages." }, { status: 429 });
  }

  let parsed: z.infer<typeof postSchema>;
  try {
    const result = postSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid message." },
        { status: 400 },
      );
    }
    parsed = result.data;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("job_messages")
    .insert({
      application_id: parsed.applicationId,
      sender_id: user.id,
      body: parsed.body,
    })
    .select(JOB_MESSAGE_COLUMNS)
    .single();

  if (error) {
    logServerEvent("error", "job_message_send_failed", { message: error.message });
    return NextResponse.json(
      { error: "Could not send message. You may not have access to this application." },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: data }, { status: 201 });
}
