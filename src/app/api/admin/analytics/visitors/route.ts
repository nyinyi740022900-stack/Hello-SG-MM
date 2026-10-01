import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/authz";
import { fetchVisitorsKpi } from "@/lib/vercelAnalytics.server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await checkAdminAuth();
  if (auth.status !== "authorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  if (!startDate || !endDate) {
    return NextResponse.json({ error: "Missing startDate/endDate." }, { status: 400 });
  }

  const { data, error } = await fetchVisitorsKpi({ startDate, endDate });
  if (error === "not_configured") {
    return NextResponse.json({ data: null, notConfigured: true });
  }
  if (error) {
    return NextResponse.json({ error }, { status: 502 });
  }

  return NextResponse.json({ data });
}
