"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchUserPayments, type PaymentStatus, type UserPaymentRow } from "@/lib/payments";
import StatusMessage from "@/components/ui/StatusMessage";

type UserPaymentHistorySectionProps = {
  refreshToken?: number;
};

function statusClasses(status: PaymentStatus) {
  if (status === "completed") return "bg-success-soft text-success border-success-border";
  if (status === "failed" || status === "refunded") {
    return "bg-danger-soft text-danger border-danger-border";
  }
  if (status === "processing") return "bg-warning-soft text-warning border-warning-border";
  return "bg-surface-muted text-ink-muted border-border";
}

export default function UserPaymentHistorySection({
  refreshToken = 0,
}: UserPaymentHistorySectionProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [payments, setPayments] = useState<UserPaymentRow[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadPayments = async () => {
      if (!user) {
        if (!isMounted) return;
        setPayments([]);
        setErrorMessage(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      const { data, error } = await fetchUserPayments(user.id, 12);
      if (!isMounted) return;

      if (error) {
        setErrorMessage(error);
        setPayments([]);
      } else {
        setPayments(data ?? []);
      }

      setIsLoading(false);
    };

    void loadPayments();

    return () => {
      isMounted = false;
    };
  }, [refreshToken, user]);

  return (
    <section id="payment-history" className="space-y-3 rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-6">
      <div>
        <h3 className="text-lg font-semibold text-ink">
          Your Payment History / သင့်ငွေပေးချေမှု မှတ်တမ်း
        </h3>
        <p className="mt-1 text-sm text-ink-subtle">
          Recent submissions and current review status.
        </p>
      </div>

      {isLoading ? (
        <StatusMessage variant="loading">Loading payments… / ငွေပေးချေမှုစာရင်း ဖတ်နေသည်…</StatusMessage>
      ) : null}

      {!isLoading && errorMessage ? (
        <StatusMessage variant="error">
          Failed to load payment history: {errorMessage}
        </StatusMessage>
      ) : null}

      {!isLoading && !errorMessage && payments.length === 0 ? (
        <StatusMessage variant="info">
          No payment records yet. / ငွေပေးချေမှု မှတ်တမ်း မရှိသေးပါ။
        </StatusMessage>
      ) : null}

      {!isLoading && !errorMessage && payments.length > 0 ? (
        <div className="space-y-3">
          {payments.map((payment) => (
            <article
              key={payment.id}
              className="rounded-md border border-border bg-surface-muted p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">
                  {payment.amount} {payment.currency} · {payment.type.toUpperCase()}
                </p>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClasses(payment.status)}`}
                >
                  {payment.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">{payment.purpose}</p>
              <p className="mt-1 text-xs text-ink-subtle">
                Ref: {payment.reference_id || "-"} · {new Date(payment.created_at).toLocaleString()}
              </p>
              {payment.admin_note ? (
                <p className="mt-2 rounded bg-surface px-2 py-1 text-xs text-ink-muted">
                  Admin note: {payment.admin_note}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
