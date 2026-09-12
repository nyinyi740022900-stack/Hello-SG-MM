"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import StatusMessage from "@/components/ui/StatusMessage";
import type { AppLocale } from "@/i18n/routing";

type RoomListingReportButtonProps = {
  listingId: string;
  locale: AppLocale;
};

export default function RoomListingReportButton({
  listingId,
  locale,
}: RoomListingReportButtonProps) {
  const t = useTranslations("housing");
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<"scam" | "inappropriate" | "spam" | "other">(
    "scam",
  );
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <p className="text-sm text-ink-muted">
        <Link
          href={{ pathname: "/login", query: { next: `/housing/${listingId}` } }}
          locale={locale}
          className="font-medium text-brand-strong underline"
        >
          {t("signInToReport")}
        </Link>
      </p>
    );
  }

  async function submit() {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/room-listings/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, reason }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? t("reportFailed"));
        return;
      }
      setMessage(t("reportSuccess"));
      setOpen(false);
    } catch {
      setError(t("networkError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      {!open ? (
        <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
          {t("report")}
        </Button>
      ) : (
        <div className="space-y-2 rounded-xl border border-border bg-surface-muted p-3">
          <label className="block text-sm font-medium text-ink">
            {t("reportReason")}
            <select
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
              value={reason}
              onChange={(e) =>
                setReason(e.target.value as "scam" | "inappropriate" | "spam" | "other")
              }
            >
              <option value="scam">{t("reasonScam")}</option>
              <option value="inappropriate">{t("reasonInappropriate")}</option>
              <option value="spam">{t("reasonSpam")}</option>
              <option value="other">{t("reasonOther")}</option>
            </select>
          </label>
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={pending} onClick={() => void submit()}>
              {pending ? t("submitting") : t("submitReport")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}
      {error ? <StatusMessage variant="error">{error}</StatusMessage> : null}
      {message ? <StatusMessage variant="success">{message}</StatusMessage> : null}
    </div>
  );
}
