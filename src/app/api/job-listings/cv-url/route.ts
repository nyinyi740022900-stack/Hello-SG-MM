import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/authz";
import { logServerEvent } from "@/lib/serverLogger";

export const dynamic = "force-dynamic";

const schema = z.object({
  applicationId: z.string().uuid(),
});

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Signed URL for a private CV — applicant, job poster, or admin only. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await createServerSupabaseClient();
  if (!session) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const db = serviceClient();
  if (!db) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  let parsed: z.infer<typeof schema>;
  try {
    const result = schema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    parsed = result.data;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { data: app } = await db
    .from("job_applications")
    .select("id,applicant_id,cv_path,job_id")
    .eq("id", parsed.applicationId)
    .maybeSingle();

  if (!app?.cv_path) {
    return NextResponse.json({ error: "No CV on this application." }, { status: 404 });
  }

  const { data: job } = await db
    .from("job_listings")
    .select("poster_id")
    .eq("id", app.job_id)
    .maybeSingle();

  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";
  const allowed =
    isAdmin ||
    app.applicant_id === user.id ||
    job?.poster_id === user.id;

  if (!allowed) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const { data: signed, error } = await db.storage
    .from("job-cvs")
    .createSignedUrl(app.cv_path, 120);

  if (error || !signed?.signedUrl) {
    logServerEvent("error", "job_cv_signed_url_failed", { message: error?.message });
    return NextResponse.json({ error: "Could not open CV." }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
