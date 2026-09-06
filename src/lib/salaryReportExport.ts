import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { summarizeSalaryEntries, type SalaryEntry } from "@/lib/salaryLog";

export type SalaryReportEntry = Pick<
  SalaryEntry,
  "entry_date" | "expected_amount" | "received_amount" | "currency" | "note"
>;

export type SalaryReportData = {
  fullName: string;
  entries: SalaryReportEntry[];
};

/**
 * Generate a chronological salary-shortfall report PDF, formatted so a worker
 * can bring it to TADM/HOME/a lawyer as a self-reported evidence summary.
 * Returns the PDF as a Uint8Array.
 */
export async function generateSalaryReportPdf(
  data: SalaryReportData,
): Promise<{ pdfBytes: Uint8Array | null; error: string | null }> {
  try {
    if (!data.fullName || data.entries.length === 0) {
      return { pdfBytes: null, error: "Name and at least one entry are required." };
    }

    const pdfDoc = await PDFDocument.create();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;
    const primaryColor = rgb(0.106, 0.42, 0.29);
    const textColor = rgb(0.1, 0.1, 0.1);
    const labelColor = rgb(0.4, 0.4, 0.4);
    const shortfallColor = rgb(0.72, 0.11, 0.11);

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - 60;
    let didPaginate = false;

    const newPageIfNeeded = (minY: number) => {
      if (y < minY) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - 60;
        didPaginate = true;
      }
    };

    page.drawText("Salary Record Summary", {
      x: margin,
      y,
      size: 22,
      font: helveticaBold,
      color: primaryColor,
    });
    y -= 24;
    page.drawText("Self-reported by worker — for TADM / HOME / legal reference", {
      x: margin,
      y,
      size: 11,
      font: helvetica,
      color: labelColor,
    });
    y -= 10;
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 30;

    page.drawText("Worker Name:", { x: margin, y, size: 10, font: helvetica, color: labelColor });
    page.drawText(data.fullName, {
      x: margin + 100,
      y,
      size: 12,
      font: helveticaBold,
      color: textColor,
    });
    y -= 30;

    // Table header
    const currency = data.entries[0]?.currency ?? "SGD";
    const columns = [
      { label: "Date", x: margin, width: 90 },
      { label: "Expected", x: margin + 100, width: 80 },
      { label: "Received", x: margin + 190, width: 80 },
      { label: "Shortfall", x: margin + 280, width: 80 },
      { label: "Note", x: margin + 370, width: 175 },
    ];

    const drawTableHeader = () => {
      for (const col of columns) {
        page.drawText(col.label, {
          x: col.x,
          y,
          size: 10,
          font: helveticaBold,
          color: labelColor,
        });
      }
      y -= 8;
      page.drawLine({
        start: { x: margin, y },
        end: { x: pageWidth - margin, y },
        thickness: 0.75,
        color: rgb(0.75, 0.75, 0.75),
      });
      y -= 16;
    };

    drawTableHeader();

    const sorted = [...data.entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date));

    for (const entry of sorted) {
      didPaginate = false;
      newPageIfNeeded(120);
      if (didPaginate) {
        drawTableHeader();
      }

      const shortfall = entry.expected_amount - entry.received_amount;
      const hasShortfall = shortfall > 0;

      page.drawText(entry.entry_date, { x: columns[0].x, y, size: 10, font: helvetica, color: textColor });
      page.drawText(entry.expected_amount.toFixed(2), {
        x: columns[1].x,
        y,
        size: 10,
        font: helvetica,
        color: textColor,
      });
      page.drawText(entry.received_amount.toFixed(2), {
        x: columns[2].x,
        y,
        size: 10,
        font: helvetica,
        color: textColor,
      });
      page.drawText(hasShortfall ? shortfall.toFixed(2) : "-", {
        x: columns[3].x,
        y,
        size: 10,
        font: helveticaBold,
        color: hasShortfall ? shortfallColor : labelColor,
      });
      const note = (entry.note ?? "").slice(0, 40);
      page.drawText(note, { x: columns[4].x, y, size: 9, font: helvetica, color: labelColor });

      y -= 20;
    }

    // Summary block
    const summary = summarizeSalaryEntries(sorted);
    newPageIfNeeded(160);
    y -= 15;
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 25;

    page.drawText("Summary", { x: margin, y, size: 13, font: helveticaBold, color: primaryColor });
    y -= 20;

    const summaryRows: Array<[string, string]> = [
      ["Total entries", String(summary.entryCount)],
      ["Total expected", `${currency} ${summary.totalExpected.toFixed(2)}`],
      ["Total received", `${currency} ${summary.totalReceived.toFixed(2)}`],
      ["Total shortfall", `${currency} ${summary.totalShortfall.toFixed(2)}`],
      ["Pay cycles with shortfall", String(summary.shortfallCount)],
    ];

    for (const [label, value] of summaryRows) {
      page.drawText(label, { x: margin, y, size: 10, font: helvetica, color: labelColor });
      page.drawText(value, {
        x: margin + 220,
        y,
        size: 11,
        font: helveticaBold,
        color: summary.totalShortfall > 0 && label === "Total shortfall" ? shortfallColor : textColor,
      });
      y -= 18;
    }

    // Disclaimer footer
    newPageIfNeeded(90);
    y -= 20;
    page.drawText(
      "This record is self-reported by the worker and is not verified by the employer, MOM, or TADM.",
      { x: margin, y, size: 8, font: helvetica, color: labelColor },
    );
    y -= 12;
    page.drawText(
      "It is intended as a personal reference to help organise information before filing a claim.",
      { x: margin, y, size: 8, font: helvetica, color: labelColor },
    );
    y -= 20;
    const timestamp = new Date().toLocaleString("en-SG", { dateStyle: "full", timeStyle: "short" });
    page.drawText(`Generated: ${timestamp}`, { x: margin, y, size: 8, font: helvetica, color: labelColor });

    const pdfBytes = await pdfDoc.save();
    return { pdfBytes, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown PDF generation error.";
    console.error("[generateSalaryReportPdf] Error:", message);
    return { pdfBytes: null, error: message };
  }
}

export function generateSalaryReportFilename(fullName: string): string {
  const sanitizedName = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const timestamp = new Date().toISOString().slice(0, 10);
  return `salary_record_${sanitizedName}_${timestamp}.pdf`;
}
