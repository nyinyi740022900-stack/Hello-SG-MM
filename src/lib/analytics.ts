import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Date range for filtering analytics queries */
export type DateRange = {
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string;   // ISO date string (YYYY-MM-DD)
};

/** Preset date range options */
export type DateRangePreset = "last7days" | "last30days" | "thisMonth" | "custom";

/** Revenue KPI data for completed, pending, and failed payments */
export type RevenueKpi = {
  completedTotal: number;
  completedCurrency: string;
  pendingCount: number;
  failedCount: number;
};

/** Revenue breakdown by status for charting */
export type RevenueBreakdown = {
  completed: number;
  pending: number;
  failed: number;
};

/** Ad performance KPI data */
export type AdKpi = {
  impressions: number;
  clicks: number;
  ctr: number; // Click-through rate as percentage (0-100)
};

/** Sponsor leads KPI data by status */
export type SponsorLeadsKpi = {
  newCount: number;
  contactedCount: number;
  closedCount: number;
};

/** Recent sponsor inquiry row */
export type SponsorInquiryRow = {
  id: string;
  name: string;
  organization: string;
  email: string;
  phone: string | null;
  message: string;
  status: "new" | "contacted" | "closed";
  created_at: string;
};

/** Combined analytics data */
export type AnalyticsData = {
  revenue: RevenueKpi;
  ads: AdKpi;
  sponsorLeads: SponsorLeadsKpi;
  recentInquiries: SponsorInquiryRow[];
  revenueBreakdown: RevenueBreakdown;
  visitors: VisitorsKpi | null;
};

/** Real site-traffic KPI, sourced from Vercel Web Analytics (not ad impressions). */
export type VisitorsKpi = {
  visitors: number;
  pageviews: number;
};

// ---------------------------------------------------------------------------
// Date range helpers
// ---------------------------------------------------------------------------

/**
 * Get date range for a preset option.
 * All dates are calculated in local timezone and returned as ISO date strings.
 */
export function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const today = new Date();
  const endDate = formatDateToISO(today);

  switch (preset) {
    case "last7days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6); // Include today = 7 days total
      return { startDate: formatDateToISO(start), endDate };
    }
    case "last30days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 29); // Include today = 30 days total
      return { startDate: formatDateToISO(start), endDate };
    }
    case "thisMonth": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: formatDateToISO(start), endDate };
    }
    case "custom":
    default:
      // Default to last 30 days if custom without explicit dates
      const defaultStart = new Date(today);
      defaultStart.setDate(defaultStart.getDate() - 29);
      return { startDate: formatDateToISO(defaultStart), endDate };
  }
}

/** Format a Date object to YYYY-MM-DD string */
function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Get ISO timestamp for start of day (00:00:00) */
function getStartOfDayISO(dateStr: string): string {
  return `${dateStr}T00:00:00.000Z`;
}

/** Get ISO timestamp for end of day (23:59:59.999) */
function getEndOfDayISO(dateStr: string): string {
  return `${dateStr}T23:59:59.999Z`;
}

// ---------------------------------------------------------------------------
// Data fetching helpers
// ---------------------------------------------------------------------------

/**
 * Fetch revenue KPI: completed payments total, pending count, failed count.
 * Uses explicit column selection per project rules.
 * Filters by date range on created_at column.
 */
export async function fetchRevenueKpi(range: DateRange): Promise<{
  data: (RevenueKpi & RevenueBreakdown) | null;
  error: string | null;
}> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const startISO = getStartOfDayISO(range.startDate);
  const endISO = getEndOfDayISO(range.endDate);

  // Fetch completed payments to sum amount
  const { data: completedPayments, error: completedError } = await supabase
    .from("payments")
    .select("amount, currency")
    .eq("status", "completed")
    .gte("created_at", startISO)
    .lte("created_at", endISO);

  if (completedError) {
    console.error("[analytics] Failed to fetch completed payments:", completedError.message);
    return { data: null, error: completedError.message };
  }

  // Calculate completed total (assuming consistent currency for simplicity)
  let completedTotal = 0;
  let completedCurrency = "SGD"; // Default currency
  const completedCount = completedPayments?.length ?? 0;
  if (completedPayments && completedPayments.length > 0) {
    completedTotal = completedPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );
    // Use currency from first payment (assumes consistency)
    completedCurrency = completedPayments[0].currency ?? "SGD";
  }

  // Fetch pending count
  const { count: pendingCount, error: pendingError } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .gte("created_at", startISO)
    .lte("created_at", endISO);

  if (pendingError) {
    console.error("[analytics] Failed to fetch pending count:", pendingError.message);
    return { data: null, error: pendingError.message };
  }

  // Fetch failed count
  const { count: failedCount, error: failedError } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("status", "failed")
    .gte("created_at", startISO)
    .lte("created_at", endISO);

  if (failedError) {
    console.error("[analytics] Failed to fetch failed count:", failedError.message);
    return { data: null, error: failedError.message };
  }

  return {
    data: {
      completedTotal,
      completedCurrency,
      pendingCount: pendingCount ?? 0,
      failedCount: failedCount ?? 0,
      // Breakdown counts for chart
      completed: completedCount,
      pending: pendingCount ?? 0,
      failed: failedCount ?? 0,
    },
    error: null,
  };
}

/**
 * Fetch ad KPI: impressions, clicks, and CTR%.
 * CTR = (clicks / impressions) * 100, handles divide-by-zero safely.
 * Filters by date range on created_at column.
 */
export async function fetchAdKpi(range: DateRange): Promise<{
  data: AdKpi | null;
  error: string | null;
}> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const startISO = getStartOfDayISO(range.startDate);
  const endISO = getEndOfDayISO(range.endDate);

  // Fetch impression count
  const { count: impressions, error: impressionError } = await supabase
    .from("ad_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "impression")
    .gte("created_at", startISO)
    .lte("created_at", endISO);

  if (impressionError) {
    console.error("[analytics] Failed to fetch impressions:", impressionError.message);
    return { data: null, error: impressionError.message };
  }

  // Fetch click count
  const { count: clicks, error: clickError } = await supabase
    .from("ad_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "click")
    .gte("created_at", startISO)
    .lte("created_at", endISO);

  if (clickError) {
    console.error("[analytics] Failed to fetch clicks:", clickError.message);
    return { data: null, error: clickError.message };
  }

  const impressionCount = impressions ?? 0;
  const clickCount = clicks ?? 0;

  // Calculate CTR safely (avoid divide-by-zero)
  const ctr = impressionCount > 0 ? (clickCount / impressionCount) * 100 : 0;

  return {
    data: {
      impressions: impressionCount,
      clicks: clickCount,
      ctr: Math.round(ctr * 100) / 100, // Round to 2 decimal places
    },
    error: null,
  };
}

/**
 * Fetch sponsor leads KPI: counts by status (new, contacted, closed).
 * Filters by date range on created_at column.
 */
export async function fetchSponsorLeadsKpi(range: DateRange): Promise<{
  data: SponsorLeadsKpi | null;
  error: string | null;
}> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const startISO = getStartOfDayISO(range.startDate);
  const endISO = getEndOfDayISO(range.endDate);

  // Fetch new count
  const { count: newCount, error: newError } = await supabase
    .from("sponsor_inquiries")
    .select("id", { count: "exact", head: true })
    .eq("status", "new")
    .gte("created_at", startISO)
    .lte("created_at", endISO);

  if (newError) {
    console.error("[analytics] Failed to fetch new sponsor inquiries:", newError.message);
    return { data: null, error: newError.message };
  }

  // Fetch contacted count
  const { count: contactedCount, error: contactedError } = await supabase
    .from("sponsor_inquiries")
    .select("id", { count: "exact", head: true })
    .eq("status", "contacted")
    .gte("created_at", startISO)
    .lte("created_at", endISO);

  if (contactedError) {
    console.error("[analytics] Failed to fetch contacted inquiries:", contactedError.message);
    return { data: null, error: contactedError.message };
  }

  // Fetch closed count
  const { count: closedCount, error: closedError } = await supabase
    .from("sponsor_inquiries")
    .select("id", { count: "exact", head: true })
    .eq("status", "closed")
    .gte("created_at", startISO)
    .lte("created_at", endISO);

  if (closedError) {
    console.error("[analytics] Failed to fetch closed inquiries:", closedError.message);
    return { data: null, error: closedError.message };
  }

  return {
    data: {
      newCount: newCount ?? 0,
      contactedCount: contactedCount ?? 0,
      closedCount: closedCount ?? 0,
    },
    error: null,
  };
}

/**
 * Fetch recent sponsor inquiries (latest 10) within date range.
 * Uses explicit column selection per project rules.
 */
export async function fetchRecentSponsorInquiries(range: DateRange): Promise<{
  data: SponsorInquiryRow[] | null;
  error: string | null;
}> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const startISO = getStartOfDayISO(range.startDate);
  const endISO = getEndOfDayISO(range.endDate);

  const { data, error } = await supabase
    .from("sponsor_inquiries")
    .select("id, name, organization, email, phone, message, status, created_at")
    .gte("created_at", startISO)
    .lte("created_at", endISO)
    .order("created_at", { ascending: false })
    .limit(10)
    .returns<SponsorInquiryRow[]>();

  if (error) {
    console.error("[analytics] Failed to fetch recent inquiries:", error.message);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Fetch all analytics data in parallel for the dashboard.
 * Accepts date range for filtering all queries.
 */
export async function fetchAllAnalytics(range: DateRange): Promise<{
  data: AnalyticsData | null;
  error: string | null;
}> {
  const [revenueResult, adResult, leadsResult, inquiriesResult, visitorsResult] = await Promise.all([
    fetchRevenueKpi(range),
    fetchAdKpi(range),
    fetchSponsorLeadsKpi(range),
    fetchRecentSponsorInquiries(range),
    fetchVisitorsKpi(range),
  ]);

  // Check for any errors
  const errors = [
    revenueResult.error,
    adResult.error,
    leadsResult.error,
    inquiriesResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    return { data: null, error: errors.join("; ") };
  }

  // All data should be present if no errors
  if (!revenueResult.data || !adResult.data || !leadsResult.data || !inquiriesResult.data) {
    return { data: null, error: "Unexpected null data in analytics response" };
  }

  return {
    data: {
      revenue: {
        completedTotal: revenueResult.data.completedTotal,
        completedCurrency: revenueResult.data.completedCurrency,
        pendingCount: revenueResult.data.pendingCount,
        failedCount: revenueResult.data.failedCount,
      },
      ads: {
        impressions: adResult.data.impressions,
        clicks: adResult.data.clicks,
        ctr: adResult.data.ctr,
      },
      sponsorLeads: leadsResult.data,
      recentInquiries: inquiriesResult.data,
      // Real site traffic — errors here (e.g. Vercel token not set up yet)
      // don't block the rest of the dashboard from loading.
      visitors: visitorsResult.data,
      // Chart data
      revenueBreakdown: {
        completed: revenueResult.data.completed,
        pending: revenueResult.data.pending,
        failed: revenueResult.data.failed,
      },
    },
    error: null,
  };
}

/**
 * Fetch real visitor/pageview counts from Vercel Web Analytics via our own
 * admin-only API route (the Vercel Access Token is a server secret and can't
 * be called directly from the browser). Returns { data: null } rather than an
 * error when the token hasn't been configured yet, so the rest of the
 * dashboard still loads.
 */
export async function fetchVisitorsKpi(
  range: DateRange
): Promise<{ data: VisitorsKpi | null; error: string | null }> {
  try {
    const params = new URLSearchParams({
      startDate: range.startDate,
      endDate: range.endDate,
    });
    const res = await fetch(`/api/admin/analytics/visitors?${params.toString()}`);
    const json = await res.json();

    if (!res.ok) {
      return { data: null, error: null };
    }
    return { data: json.data ?? null, error: null };
  } catch {
    return { data: null, error: null };
  }
}

// ---------------------------------------------------------------------------
// CSV Export helpers
// ---------------------------------------------------------------------------

/**
 * Generate CSV content from analytics data.
 * Includes KPIs and recent inquiries with header rows.
 */
export function generateAnalyticsCSV(data: AnalyticsData, range: DateRange): string {
  const rows: string[] = [];

  // Header with date range info
  rows.push(`"Analytics Export - ${range.startDate} to ${range.endDate}"`);
  rows.push("");

  // Visitors section (real site traffic, not ad impressions)
  if (data.visitors) {
    rows.push('"Visitors"');
    rows.push('"Metric","Value"');
    rows.push(`"Visitors","${data.visitors.visitors}"`);
    rows.push(`"Page Views","${data.visitors.pageviews}"`);
    rows.push("");
  }

  // Revenue KPI section
  rows.push('"Revenue Summary"');
  rows.push('"Metric","Value"');
  rows.push(`"Completed Total","${data.revenue.completedCurrency} ${data.revenue.completedTotal.toFixed(2)}"`);
  rows.push(`"Completed Count","${data.revenueBreakdown.completed}"`);
  rows.push(`"Pending Count","${data.revenue.pendingCount}"`);
  rows.push(`"Failed Count","${data.revenue.failedCount}"`);
  rows.push("");

  // Ad KPI section
  rows.push('"Ad Performance"');
  rows.push('"Metric","Value"');
  rows.push(`"Impressions","${data.ads.impressions}"`);
  rows.push(`"Clicks","${data.ads.clicks}"`);
  rows.push(`"CTR %","${data.ads.ctr.toFixed(2)}%"`);
  rows.push("");

  // Sponsor Leads section
  rows.push('"Sponsor Leads"');
  rows.push('"Metric","Value"');
  rows.push(`"New","${data.sponsorLeads.newCount}"`);
  rows.push(`"Contacted","${data.sponsorLeads.contactedCount}"`);
  rows.push(`"Closed","${data.sponsorLeads.closedCount}"`);
  rows.push("");

  // Recent Inquiries section
  rows.push('"Recent Sponsor Inquiries"');
  rows.push('"Name","Organization","Email","Phone","Status","Message","Created At"');
  for (const inquiry of data.recentInquiries) {
    // Escape quotes in strings for CSV
    const escapeCsv = (str: string | null): string => {
      if (str === null) return "";
      return `"${str.replace(/"/g, '""')}"`;
    };
    rows.push(
      `${escapeCsv(inquiry.name)},${escapeCsv(inquiry.organization)},${escapeCsv(inquiry.email)},${escapeCsv(inquiry.phone)},${escapeCsv(inquiry.status)},${escapeCsv(inquiry.message)},${escapeCsv(inquiry.created_at)}`
    );
  }

  return rows.join("\n");
}

/**
 * Trigger CSV file download in browser.
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
