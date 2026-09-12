import { NextRequest, NextResponse } from "next/server";
import { getPeriodAnalysis, isAnalysisPeriod } from "@/lib/lottery";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Period analysis over Singapore Pools official draw history.
 * Query: ?period=week|month|year
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const periodRaw = request.nextUrl.searchParams.get("period") ?? "week";
  if (!isAnalysisPeriod(periodRaw)) {
    return NextResponse.json(
      { error: "period must be week, month, or year." },
      { status: 400 },
    );
  }

  try {
    const analysis = await getPeriodAnalysis(periodRaw);
    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not build lottery analysis.",
      },
      { status: 500 },
    );
  }
}
