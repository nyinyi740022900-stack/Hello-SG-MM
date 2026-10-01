"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchPendingPayments,
  fetchUserProfile,
  resolveReceiptAccessUrl,
  type PendingPaymentRow,
  type UserProfileRole,
} from "@/lib/payments";
import StatusMessage from "@/components/ui/StatusMessage";
import { INPUT_CLASS } from "@/components/ui/FormField";

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

type ActionState =
  | { phase: "idle" }
  | { phase: "pending"; message: string }
  | { phase: "success"; message: string }
  | { phase: "error"; message: string };

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

/** Render a payment method label with a badge colour. */
function MethodBadge({ method }: { method: PendingPaymentRow["type"] }) {
  const label = method === "kpay" ? "KBZPay" : method === "wavepay" ? "WavePay" : method;
  const cls =
    method === "kpay"
      ? "bg-brand-soft text-brand-strong"
      : method === "wavepay"
        ? "bg-accent-soft text-accent"
        : "bg-surface-muted text-ink-muted";
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

/** One labelled detail row inside a payment card. */
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-2">
      <dt className="w-28 shrink-0 text-xs font-medium text-ink-subtle">{label}</dt>
      <dd className="flex-1 text-xs text-ink break-all">{children}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AdminPaymentReviewPanel() {
  const { user, isLoading, isConfigured } = useAuth();
  const [payments, setPayments] = useState<PendingPaymentRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionState, setActionState] = useState<ActionState>({ phase: "idle" });
  const [noteById, setNoteById] = useState<Record<string, string>>({});

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

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadPayments = async () => {
    setIsRefreshing(true);
    setLoadError(null);

    const { data, error } = await fetchPendingPayments();
    if (error) {
      setLoadError(error);
      setPayments([]);
      setIsRefreshing(false);
      return;
    }

    setPayments(data ?? []);
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (!isConfigured || !user || !isAdmin || isLoadingProfile) {
      return;
    }
    const timer = setTimeout(() => {
      void loadPayments();
    }, 0);
    return () => clearTimeout(timer);
  }, [isAdmin, isConfigured, user, isLoadingProfile]);

  // ── Action handler ─────────────────────────────────────────────────────

  const handleReview = async (
    paymentId: string,
    decision: "completed" | "failed",
  ) => {
    const verb = decision === "completed" ? "approve" : "reject";
    const confirmed = window.confirm(
      `Are you sure you want to ${verb} this payment? / ဤငွေပေးချေမှုကို ${decision === "completed" ? "အတည်ပြုမည်" : "ငြင်းပယ်မည်"} လား?`,
    );
    if (!confirmed) return;

    setActionState({ phase: "pending", message: "Updating payment…" });

    const response = await fetch("/api/admin/payments/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentId,
        status: decision,
        adminNote: noteById[paymentId] ?? "",
      }),
    });
    const result: { error?: string } = await response.json().catch(() => ({}));

    if (!response.ok) {
      setActionState({
        phase: "error",
        message: `Update failed: ${result.error ?? "Unknown error"}`,
      });
      return;
    }

    setActionState({
      phase: "success",
      message:
        decision === "completed"
          ? `Payment approved. / ငွေပေးချေမှု အတည်ပြုပြီး။`
          : `Payment rejected. / ငွေပေးချေမှု ငြင်းပယ်ပြီး။`,
    });

    await loadPayments();
  };

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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          <span className="font-semibold text-ink">{payments.length}</span> pending payment
          {payments.length !== 1 ? "s" : ""} / ဆိုင်ဆဲ ငွေပေးချေမှု
        </p>
        <button
          type="button"
          disabled={isRefreshing}
          onClick={() => void loadPayments()}
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

      {/* Load error */}
      {loadError ? (
        <StatusMessage variant="error">{loadError}</StatusMessage>
      ) : null}

      {/* Action feedback */}
      {actionState.phase !== "idle" ? (
        <StatusMessage
          variant={
            actionState.phase === "success"
              ? "success"
              : actionState.phase === "error"
                ? "error"
                : "loading"
          }
        >
          {actionState.message}
        </StatusMessage>
      ) : null}

      {/* Empty state */}
      {!isRefreshing && payments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong bg-surface-muted py-10 text-center">
          <span className="text-2xl" aria-hidden="true">✅</span>
          <p className="text-sm font-medium text-ink-muted">
            All caught up! / အားလုံး ဆောင်ရွက်ပြီးပြီ။
          </p>
          <p className="text-xs text-ink-subtle">No pending payments to review right now.</p>
        </div>
      ) : null}

      {/* Payment cards */}
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="space-y-3 rounded-lg border border-border bg-surface p-4 shadow-sm"
        >
          {/* Card header */}
          <div className="flex items-center justify-between gap-2">
            <MethodBadge method={payment.type} />
            <span className="text-xs text-ink-subtle">{formatDate(payment.created_at)}</span>
          </div>

          {/* Details grid */}
          <dl className="space-y-1.5">
            <DetailRow label="Amount / ပမာဏ">
              <span className="font-semibold">
                {payment.currency} {payment.amount.toFixed(2)}
              </span>
            </DetailRow>
            <DetailRow label="Purpose / ရည်ရွယ်ချက်">
              {payment.purpose}
            </DetailRow>
            <DetailRow label="Reference / ကုဒ်">
              {payment.reference_id ?? <span className="italic text-ink-subtle">—</span>}
            </DetailRow>
            <DetailRow label="User ID">
              <span className="font-mono">{payment.user_id}</span>
            </DetailRow>
            <DetailRow label="Payment ID">
              <span className="font-mono text-ink-subtle">{payment.id}</span>
            </DetailRow>
            <DetailRow label="Receipt / ဘောင်ချာ">
              {payment.receipt_path ? (
                <button
                  type="button"
                  className="text-brand underline hover:text-brand-strong"
                  onClick={async () => {
                    if (!payment.receipt_path) return;
                    setActionState({ phase: "pending", message: "Opening receipt…" });
                    const { url, error } = await resolveReceiptAccessUrl(payment.receipt_path);
                    if (error ?? !url) {
                      setActionState({
                        phase: "error",
                        message: `Could not open receipt: ${error ?? "Unknown error"}`,
                      });
                      return;
                    }
                    window.open(url, "_blank", "noopener,noreferrer");
                    setActionState({ phase: "idle" });
                  }}
                >
                  View receipt / ဘောင်ချာ ကြည့်ရန်
                </button>
              ) : (
                <span className="italic text-ink-subtle">No receipt attached / ဘောင်ချာ မပါ</span>
              )}
            </DetailRow>
          </dl>

          {/* Admin note */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-ink-muted">
              Admin Note / မှတ်ချက်{" "}
              <span className="font-normal text-ink-subtle">(optional / ချန်ထားနိုင်)</span>
            </p>
            <textarea
              className={INPUT_CLASS}
              rows={2}
              placeholder="Reason for approval or rejection… / အတည်ပြု/ငြင်းပယ် အကြောင်းပြချက်…"
              value={noteById[payment.id] ?? ""}
              onChange={(event) => {
                const val = event.target.value;
                setNoteById((prev) => ({ ...prev, [payment.id]: val }));
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              className="flex-1 rounded bg-success px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
              onClick={() => void handleReview(payment.id, "completed")}
            >
              ✔ Approve / အတည်ပြုရန်
            </button>
            <button
              type="button"
              className="flex-1 rounded bg-danger px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
              onClick={() => void handleReview(payment.id, "failed")}
            >
              ✖ Reject / ငြင်းပယ်ရန်
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
