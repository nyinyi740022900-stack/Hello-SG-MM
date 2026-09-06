"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { loadPassportDraft } from "@/lib/formDrafts";
import { calculatePassportExpiry, type PassportExpiryInfo } from "@/lib/passportExpiry";
import { LinkButton } from "@/components/ui/Button";

const STATUS_CLASSES: Record<string, string> = {
  warning: "border-warning-border bg-warning-soft text-warning",
  urgent: "border-danger-border bg-danger-soft text-danger",
  expired: "border-danger-border bg-danger-soft text-danger",
};

export default function ExpiryReminderBanner() {
  const t = useTranslations("expiryReminder");
  const { user } = useAuth();
  const [info, setInfo] = useState<PassportExpiryInfo | null>(null);

  useEffect(() => {
    if (!user) {
      queueMicrotask(() => setInfo(null));
      return;
    }
    let mounted = true;
    queueMicrotask(async () => {
      const { data } = await loadPassportDraft(user.id);
      if (!mounted) return;
      const issuedDate = data?.currentPassportIssuedDate;
      if (!issuedDate) {
        setInfo(null);
        return;
      }
      setInfo(calculatePassportExpiry(issuedDate));
    });
    return () => {
      mounted = false;
    };
  }, [user]);

  if (!info || info.status === "ok" || info.status === "unknown") {
    return null;
  }

  const messageKey =
    info.status === "expired" ? "expired" : info.status === "urgent" ? "urgent" : "warning";

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${STATUS_CLASSES[info.status]}`}>
      <div>
        <p className="font-semibold">{t(`${messageKey}Title`)}</p>
        <p className="mt-1 text-sm">
          {t(`${messageKey}Body`, { date: info.expiryDate, days: Math.max(0, info.daysRemaining) })}
        </p>
      </div>
      <LinkButton href="/passport/wizard" variant="secondary" size="md" className="h-9 shrink-0 px-4 text-xs">
        {t("cta")}
      </LinkButton>
    </div>
  );
}
