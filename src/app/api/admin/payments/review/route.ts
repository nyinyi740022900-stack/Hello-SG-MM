import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "@/lib/authz";
import { reviewPayment } from "@/lib/payments";

/**
 * Approving a payment grants an entitlement (e.g. a passport-renewal PDF
 * export) or activates a paid feature (e.g. a featured job listing), so this
 * writes with the admin's identity re-verified server-side via
 * checkAdminAuth() rather than trusting whatever the browser session claims —
 * the same gap closed for /api/admin/rates and the other admin routes.
 */

export const dynamic = "force-dynamic";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await checkAdminAuth();
  if (auth.status !== "authorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const db = serviceClient();
  if (!db) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  let payload: { paymentId?: unknown; status?: unknown; adminNote?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const paymentId = payload.paymentId;
  const status = payload.status;
  if (typeof paymentId !== "string" || !paymentId) {
    return NextResponse.json({ error: "Missing paymentId." }, { status: 400 });
  }
  if (status !== "completed" && status !== "failed") {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  const adminNote = typeof payload.adminNote === "string" ? payload.adminNote : "";

  const { error, entitlementCreated } = await reviewPayment(
    paymentId,
    status,
    adminNote,
    db,
    auth.userId,
  );

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ entitlementCreated });
}
