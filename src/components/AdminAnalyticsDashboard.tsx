"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchAllAnalytics,
  getDateRangeFromPreset,
  generateAnalyticsCSV,
  downloadCSV,
  type AnalyticsData,
  type SponsorInquiryRow,
  type DateRange,
  type DateRangePreset,
} from "@/lib/analytics";
import { fetchUserProfile, type UserProfileRole } from "@/lib/payments";
import StatusMessage from "@/components/ui/StatusMessage";

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/** Format an ISO timestamp to a human-readable local date+time string. */
function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Format currency amount with proper locale formatting. */
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Status badge component for sponsor inquiry status. */
function StatusBadge({ status }: { status: SponsorInquiryRow["status"] }) {
  const config = {
    new: { label: "New / အသစ်", class: "bg-brand-soft text-brand-strong" },
    contacted: { label: "Contacted / ဆက်သွယ်ပြီး", class: "bg-warning-soft text-warning" },
    closed: { label: "Closed / ပိတ်ပြီး", class: "bg-success-soft text-success" },
  };
  const { label, class: cls } = config[status];
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// KPI Card components
// ---------------------------------------------------------------------------

type KpiCardProps = {
  title: string;
  children: React.ReactNode;
  icon: string;
};

function KpiCard({ title, children, icon }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl" aria-hidden="true">{icon}</span>
        <h3 className="text-sm font-semibold text-ink-muted">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

type KpiStatProps = {
  label: string;
  value: string | number;
  variant?: "default" | "success" | "warning" | "muted";
};

function KpiStat({ label, value, variant = "default" }: KpiStatProps) {
  const valueColors = {
    default: "text-ink",
    success: "text-success",
    warning: "text-warning",
    muted: "text-ink-subtle",
  };
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className={`text-lg font-bold ${valueColors[variant]}`}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Date Range Filter component
// ---------------------------------------------------------------------------

type DateRangeFilterProps = {
  preset: DateRangePreset;
  customRange: DateRange;
  onPresetChange: (preset: DateRangePreset) => void;
  onCustomRangeChange: (range: DateRange) => void;
};

const presetLabels: Record<DateRangePreset, string> = {
  last7days: "Last 7 Days / နောက်ဆုံး ၇ ရက်",
  last30days: "Last 30 Days / နောက်ဆုံး ၃၀ ရက်",
  thisMonth: "This Month / ဤလ",
  custom: "Custom / စိတ်ကြိုက်",
};

function DateRangeFilter({
  preset,
  customRange,
  onPresetChange,
  onCustomRangeChange,
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-ink-muted">
          Date Range / ရက်စွဲအပိုင်းအခြား
        </label>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(presetLabels) as DateRangePreset[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPresetChange(p)}
              className={[
                "rounded px-2 py-1 text-xs font-medium transition-colors",
                preset === p
                  ? "bg-brand text-ink-on-brand"
                  : "bg-surface-muted text-ink-muted hover:bg-border",
              ].join(" ")}
            >
              {presetLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {preset === "custom" && (
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-subtle">Start / စတင်</label>
            <input
              type="date"
              value={customRange.startDate}
              onChange={(e) =>
                onCustomRangeChange({ ...customRange, startDate: e.target.value })
              }
              className="rounded border border-border-strong px-2 py-1 text-xs"
            />
          </div>
          <span className="text-ink-subtle pt-4">→</span>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-subtle">End / အဆုံး</label>
            <input
              type="date"
              value={customRange.endDate}
              onChange={(e) =>
                onCustomRangeChange({ ...customRange, endDate: e.target.value })
              }
              className="rounded border border-border-strong px-2 py-1 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inquiry List component
// ---------------------------------------------------------------------------

type InquiryListProps = {
  inquiries: SponsorInquiryRow[];
};

function InquiryList({ inquiries }: InquiryListProps) {
  if (inquiries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong bg-surface-muted py-6 text-center">
        <span className="text-2xl" aria-hidden="true">📭</span>
        <p className="text-sm font-medium text-ink-muted">
          No sponsor inquiries yet. / Sponsor စုံစမ်းမှု မရှိသေးပါ။
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {inquiries.map((inquiry) => (
        <div
          key={inquiry.id}
          className="rounded-lg border border-border bg-surface p-3 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <StatusBadge status={inquiry.status} />
            <span className="text-xs text-ink-subtle">{formatDate(inquiry.created_at)}</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">
              {inquiry.name} — {inquiry.organization}
            </p>
            <p className="text-xs text-ink-muted break-all">
              {inquiry.email}
              {inquiry.phone ? ` • ${inquiry.phone}` : ""}
            </p>
            <p className="text-xs text-ink-subtle line-clamp-2 mt-1">
              {inquiry.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AdminAnalyticsDashboard() {
  const { user, isLoading, isConfigured } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Date range filter state (default: last 30 days)
  const [preset, setPreset] = useState<DateRangePreset>("last30days");
  const [customRange, setCustomRange] = useState<DateRange>(() =>
    getDateRangeFromPreset("last30days")
  );

  // Profile-based role check (secure - from profiles table, not user_metadata)
  const [profileRole, setProfileRole] = useState<UserProfileRole | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const isAdmin = profileRole === "admin";

  // Fetch user profile for role check
  useEffect(() => {
    // Skip loading if Supabase is not configured or no user
    if (!isConfigured || !user) {
      // Use a microtask to avoid synchronous setState in effect
      queueMicrotask(() => setIsLoadingProfile(false));
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      const { data } = await fetchUserProfile(user.id);
      if (isMounted) {
        setProfileRole(data?.role ?? null);
        setIsLoadingProfile(false);
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [isConfigured, user]);

  // Get the active date range based on preset or custom selection
  const getActiveDateRange = useCallback((): DateRange => {
    if (preset === "custom") {
      return customRange;
    }
    return getDateRangeFromPreset(preset);
  }, [preset, customRange]);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadAnalytics = useCallback(async () => {
    setIsRefreshing(true);
    setLoadError(null);

    const range = getActiveDateRange();
    const { data, error } = await fetchAllAnalytics(range);
    if (error) {
      setLoadError(error);
      setAnalyticsData(null);
      setIsRefreshing(false);
      return;
    }

    setAnalyticsData(data);
    setIsRefreshing(false);
  }, [getActiveDateRange]);

  // Handle preset change - auto-refresh data
  const handlePresetChange = useCallback((newPreset: DateRangePreset) => {
    setPreset(newPreset);
    if (newPreset !== "custom") {
      // Reset custom range to the new preset's range for consistency
      setCustomRange(getDateRangeFromPreset(newPreset));
    }
  }, []);

  // Handle custom range change - auto-refresh when custom is selected
  const handleCustomRangeChange = useCallback((newRange: DateRange) => {
    setCustomRange(newRange);
  }, []);

  // ── CSV Export ────────────────────────────────────────────────────────────

  const handleExportCSV = useCallback(() => {
    if (!analyticsData) return;

    const range = getActiveDateRange();
    const csvContent = generateAnalyticsCSV(analyticsData, range);
    const filename = `analytics_${range.startDate}_to_${range.endDate}.csv`;
    downloadCSV(csvContent, filename);
  }, [analyticsData, getActiveDateRange]);

  // ── Effects ───────────────────────────────────────────────────────────────

  // Initial load and reload on date range change
  useEffect(() => {
    if (!isConfigured || !user || !isAdmin || isLoadingProfile) {
      return;
    }
    const timer = setTimeout(() => {
      void loadAnalytics();
    }, 0);
    return () => clearTimeout(timer);
  }, [isAdmin, isConfigured, user, loadAnalytics, isLoadingProfile]);

  // ── Guard states ───────────────────────────────────────────────────────

  if (!isConfigured) {
    return (
      <StatusMessage variant="error">
        Supabase is not configured. / Supabase သတ်မှတ်မထားပါ။
      </StatusMessage>
    );
  }

  if (isLoading || isLoadingProfile) {
    return (
      <StatusMessage variant="loading">
        Checking session… / Session စစ်ဆေးနေသည်…
      </StatusMessage>
    );
  }

  if (!user) {
    return (
      <StatusMessage variant="warning">
        You must be logged in to access this panel. / ဤ panel ကို ဝင်ရောက်ရန် အကောင့်ဝင်ပါ။
      </StatusMessage>
    );
  }

  if (!isAdmin) {
    return (
      <StatusMessage variant="warning">
        <span className="font-semibold">Admin access required. / Admin ခွင့်ပြုချက် လိုသည်။</span>
        <span className="block mt-0.5 text-xs opacity-80">
          Your account does not have <code className="font-mono bg-warning-soft px-0.5 rounded">role=admin</code>{" "}
          in the profiles table. Contact a super-admin to have it set.
          {/* မြန်မာ: သင့် account ၌ role=admin မပါပဲ ရှိသည်။ Super-admin ကို ဆက်သွယ်ပါ။ */}
        </span>
      </StatusMessage>
    );
  }

  // ── Main panel ─────────────────────────────────────────────────────────

  const activeRange = getActiveDateRange();

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <DateRangeFilter
        preset={preset}
        customRange={customRange}
        onPresetChange={handlePresetChange}
        onCustomRangeChange={handleCustomRangeChange}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-muted">
          Showing data from{" "}
          <span className="font-medium">{activeRange.startDate}</span> to{" "}
          <span className="font-medium">{activeRange.endDate}</span>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!analyticsData || isRefreshing}
            onClick={handleExportCSV}
            className={[
              "rounded border px-3 py-1 text-xs font-medium transition-colors",
              !analyticsData || isRefreshing
                ? "cursor-not-allowed border-border bg-surface-muted text-ink-subtle"
                : "border-success-border bg-success-soft text-success hover:bg-success-border/40",
            ].join(" ")}
          >
            📥 Export CSV / CSV ထုတ်ရန်
          </button>
          <button
            type="button"
            disabled={isRefreshing}
            onClick={() => void loadAnalytics()}
            className={[
              "rounded border px-3 py-1 text-xs font-medium transition-colors",
              isRefreshing
                ? "cursor-not-allowed border-border bg-surface-muted text-ink-subtle"
                : "border-border-strong bg-surface text-ink-muted hover:bg-surface-muted",
            ].join(" ")}
          >
            {isRefreshing ? "Refreshing…" : "↺ Refresh / ပြန်ဆွဲရန်"}
          </button>
        </div>
      </div>

      {/* Load error */}
      {loadError ? (
        <StatusMessage variant="error">{loadError}</StatusMessage>
      ) : null}

      {/* Loading state */}
      {isRefreshing && !analyticsData ? (
        <StatusMessage variant="loading">
          Loading analytics data… / Analytics data ရယူနေသည်…
        </StatusMessage>
      ) : null}

      {/* KPI Cards Grid */}
      {analyticsData ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Visitors KPI — real site traffic (Vercel Web Analytics), separate
                from the Ad Performance card below, which counts ad-banner
                impressions only and fires on far fewer pages. */}
            <KpiCard title="Visitors / လာရောက်သူ" icon="👥">
              {analyticsData.visitors ? (
                <>
                  <KpiStat
                    label="Visitors / လူဦးရေ"
                    value={analyticsData.visitors.visitors.toLocaleString()}
                    variant="success"
                  />
                  <KpiStat
                    label="Page Views / ကြည့်ရှုမှု"
                    value={analyticsData.visitors.pageviews.toLocaleString()}
                  />
                </>
              ) : (
                <p className="text-xs text-ink-subtle">
                  Not set up yet. Add a Vercel Access Token (VERCEL_TOKEN) to enable this.
                  {/* မြန်မာ: မသတ်မှတ်ရသေးပါ။ VERCEL_TOKEN ထည့်ပါ။ */}
                </p>
              )}
            </KpiCard>

            {/* Revenue KPI */}
            <KpiCard title="Revenue / ဝင်ငွေ" icon="💰">
              <KpiStat
                label="Completed Total / စုစုပေါင်း"
                value={formatCurrency(
                  analyticsData.revenue.completedTotal,
                  analyticsData.revenue.completedCurrency
                )}
                variant="success"
              />
              <KpiStat
                label="Pending / ဆိုင်းထားသည်"
                value={analyticsData.revenue.pendingCount}
                variant="warning"
              />
              <KpiStat
                label="Failed / မအောင်မြင်"
                value={analyticsData.revenue.failedCount}
                variant="muted"
              />
            </KpiCard>

            {/* Ad KPI */}
            <KpiCard title="Ad Performance / ကြော်ငြာ" icon="📊">
              <KpiStat
                label="Impressions / ကြည့်ရှုမှု"
                value={analyticsData.ads.impressions.toLocaleString()}
              />
              <KpiStat
                label="Clicks / နှိပ်မှု"
                value={analyticsData.ads.clicks.toLocaleString()}
              />
              <KpiStat
                label="CTR %"
                value={`${analyticsData.ads.ctr.toFixed(2)}%`}
                variant={analyticsData.ads.ctr > 1 ? "success" : "muted"}
              />
            </KpiCard>

            {/* Sponsor Leads KPI */}
            <KpiCard title="Sponsor Leads / Sponsor ဦးဆောင်မှု" icon="🤝">
              <KpiStat
                label="New / အသစ်"
                value={analyticsData.sponsorLeads.newCount}
                variant={analyticsData.sponsorLeads.newCount > 0 ? "warning" : "muted"}
              />
              <KpiStat
                label="Contacted / ဆက်သွယ်ပြီး"
                value={analyticsData.sponsorLeads.contactedCount}
              />
              <KpiStat
                label="Closed / ပိတ်ပြီး"
                value={analyticsData.sponsorLeads.closedCount}
                variant="success"
              />
            </KpiCard>
          </div>

          {/* Recent Sponsor Inquiries */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-ink">
              Recent Sponsor Inquiries / လတ်တလော Sponsor စုံစမ်းမှုများ
            </h3>
            <p className="text-xs text-ink-subtle">
              Latest 10 sponsor inquiries. / နောက်ဆုံး Sponsor စုံစမ်းမှု ၁၀ ခု။
            </p>
            <InquiryList inquiries={analyticsData.recentInquiries} />
          </section>
        </>
      ) : null}
    </div>
  );
}
