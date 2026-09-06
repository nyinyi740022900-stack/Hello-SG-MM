import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { consumeRateLimit } from "@/lib/rateLimit";
import { logServerEvent } from "@/lib/serverLogger";
import {
  generateSalaryReportPdf,
  generateSalaryReportFilename,
  type SalaryReportData,
} from "@/lib/salaryReportExport";

const entrySchema = z.object({
  entry_date: z.string().min(4),
  expected_amount: z.number().nonnegative(),
  received_amount: z.number().nonnegative(),
  currency: z.string().min(1),
  note: z.string().nullable().optional(),
});

const exportRequestSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  entries: z.array(entrySchema).min(1, "At least one salary entry is required."),
});

type ExportRequestBody = z.infer<typeof exportRequestSchema>;

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/export/salary-report
 *
 * Generate and download the salary evidence log as a PDF.
 * Requires a valid auth session.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

  const ipLimit = consumeRateLimit({
    key: `export-ip:${ip}`,
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!ipLimit.allowed) {
    return errorResponse("Too many export attempts. Please try again later.", 429);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return errorResponse("Server configuration error.", 500);
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse("Missing or invalid authorization header.", 401);
  }

  const accessToken = authHeader.slice(7);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) {
    return errorResponse("Invalid or expired session.", 401);
  }

  const userId = userData.user.id;

  let body: ExportRequestBody;
  try {
    const rawBody: unknown = await request.json();
    const parsed = exportRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid request body.";
      return errorResponse(firstError, 400);
    }
    body = parsed.data;
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  const exportData: SalaryReportData = {
    fullName: body.fullName,
    entries: body.entries.map((entry) => ({
      entry_date: entry.entry_date,
      expected_amount: entry.expected_amount,
      received_amount: entry.received_amount,
      currency: entry.currency,
      note: entry.note ?? null,
    })),
  };

  const { pdfBytes, error: pdfError } = await generateSalaryReportPdf(exportData);
  if (pdfError || !pdfBytes) {
    logServerEvent("error", "salary_report_export_pdf_generation_failed", {
      userId,
      ip,
      reason: pdfError ?? "unknown",
    });
    return errorResponse("Failed to generate PDF.", 500);
  }

  const filename = generateSalaryReportFilename(body.fullName);
  const pdfBuffer = Buffer.from(pdfBytes);

  logServerEvent("info", "salary_report_export_success", {
    userId,
    ip,
  });

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.length),
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
