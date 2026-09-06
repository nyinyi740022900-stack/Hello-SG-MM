"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getUserEntitlements,
  PRODUCT_CODES,
  type EntitlementRow,
} from "@/lib/entitlements";

/**
 * Human-readable labels for product codes.
 */
const PRODUCT_LABELS: Record<string, string> = {
  [PRODUCT_CODES.PASSPORT_RENEWAL_PDF]: "Passport Renewal PDF Export",
};

/**
 * Format a date string to a human-readable format.
 */
function formatDate(isoString: string | null): string {
  if (!isoString) return "Never";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

/**
 * Check if an entitlement is expired.
 */
function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

/**
 * Get remaining exports for an entitlement.
 */
function getRemainingExports(ent: EntitlementRow): number {
  return Math.max(0, ent.total_exports - ent.used_exports);
}

export default function EntitlementSummaryCard() {
  const { user, isConfigured, isLoading } = useAuth();
  const [entitlements, setEntitlements] = useState<EntitlementRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Track previous user ID for reset detection
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentUserId = user?.id ?? null;

    // Reset state when user changes (including logout)
    if (previousUserIdRef.current !== currentUserId) {
      previousUserIdRef.current = currentUserId;
      if (!currentUserId) {
        // Defer state update to avoid synchronous setState in effect
        queueMicrotask(() => {
          setEntitlements([]);
          setLoadError(null);
          setIsLoadingData(false);
        });
        return;
      }
    }

    if (!isConfigured || isLoading || !user) {
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      setIsLoadingData(true);
      setLoadError(null);

      const { data, error } = await getUserEntitlements(user.id);

      if (!isMounted) return;

      if (error) {
        setLoadError(error);
        setEntitlements([]);
      } else {
        setEntitlements(data ?? []);
      }

      setIsLoadingData(false);
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [isConfigured, isLoading, user]);

  // Guard states
  if (!isConfigured) {
    return (
      <div className="rounded border border-border bg-surface-muted p-4 text-sm text-ink-muted">
        Supabase is not configured.
      </div>
    );
  }

  if (isLoading || isLoadingData) {
    return (
      <div className="rounded border border-border bg-surface-muted p-4 text-sm text-ink-muted">
        Loading entitlements…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded border border-warning-border bg-warning-soft p-4 text-sm text-warning">
        Please log in to view your entitlements.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded border border-danger-border bg-danger-soft p-4 text-sm text-danger">
        Failed to load entitlements: {loadError}
      </div>
    );
  }

  if (entitlements.length === 0) {
    return (
      <div className="rounded border border-border bg-surface-muted p-4 text-sm text-ink-muted">
        <p className="font-medium">No entitlements yet</p>
        <p className="mt-1 text-ink-subtle">
          Complete a payment to unlock premium features like PDF export.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entitlements.map((ent) => {
        const expired = isExpired(ent.expires_at);
        const remaining = getRemainingExports(ent);
        const hasRemaining = remaining > 0 && !expired;
        const productLabel = PRODUCT_LABELS[ent.product_code] ?? ent.product_code;

        return (
          <div
            key={ent.id}
            className={[
              "rounded border p-4",
              hasRemaining
                ? "border-success-border bg-success-soft"
                : expired
                  ? "border-danger-border bg-danger-soft"
                  : "border-border bg-surface-muted",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p
                  className={[
                    "font-medium",
                    hasRemaining
                      ? "text-success"
                      : expired
                        ? "text-danger"
                        : "text-ink-muted",
                  ].join(" ")}
                >
                  {productLabel}
                </p>

                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="text-ink-muted">
                    Total exports:{" "}
                    <span className="font-medium text-ink">{ent.total_exports}</span>
                  </div>
                  <div className="text-ink-muted">
                    Used:{" "}
                    <span className="font-medium text-ink">{ent.used_exports}</span>
                  </div>
                  <div className="text-ink-muted">
                    Remaining:{" "}
                    <span
                      className={[
                        "font-medium",
                        hasRemaining ? "text-success" : "text-ink-subtle",
                      ].join(" ")}
                    >
                      {remaining}
                    </span>
                  </div>
                  <div className="text-ink-muted">
                    Expires:{" "}
                    <span
                      className={[
                        "font-medium",
                        expired ? "text-danger" : "text-ink",
                      ].join(" ")}
                    >
                      {ent.expires_at ? formatDate(ent.expires_at) : "Never"}
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-xs text-ink-subtle">
                  Granted: {formatDate(ent.created_at)}
                </p>
              </div>

              {/* Status badge */}
              <div
                className={[
                  "shrink-0 rounded-full px-2 py-1 text-xs font-medium",
                  hasRemaining
                    ? "bg-success-border/60 text-success"
                    : expired
                      ? "bg-danger-border/60 text-danger"
                      : "bg-border text-ink-muted",
                ].join(" ")}
              >
                {hasRemaining ? "Active" : expired ? "Expired" : "Used"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
