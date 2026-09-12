"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import FormField, { INPUT_CLASS } from "@/components/ui/FormField";
import StatusMessage from "@/components/ui/StatusMessage";
import { uploadPaymentReceipt } from "@/lib/payments";
import {
  JOB_FEATURED_DAYS,
  JOB_FEATURED_PRICE_SGD,
} from "@/lib/jobListings";

type JobFeaturedPaymentFormProps = {
  jobId: string;
};

export default function JobFeaturedPaymentForm({
  jobId,
}: JobFeaturedPaymentFormProps) {
  const t = useTranslations("jobs");
  const { user } = useAuth();
  const [method, setMethod] = useState<"kpay" | "wavepay">("kpay");
  const [transactionReference, setTransactionReference] = useState("");
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!user) return null;
  const userId = user.id;

  async function onReceiptChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const { path, error: uploadError } = await uploadPaymentReceipt(userId, file);
      if (uploadError || !path) {
        setError(uploadError ?? t("receiptUploadFailed"));
        return;
      }
      setReceiptPath(path);
    } catch {
      setError(t("networkError"));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!receiptPath) {
      setError(t("receiptRequired"));
      return;
    }
    setPending(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await fetch("/api/job-listings/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          method,
          transactionReference,
          receiptPath,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? t("featuredPayFailed"));
        return;
      }
      setSuccess(true);
      setTransactionReference("");
      setReceiptPath(null);
    } catch {
      setError(t("networkError"));
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return <StatusMessage variant="success">{t("featuredPaySuccess")}</StatusMessage>;
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
      <p className="text-sm text-ink-muted">
        {t("featuredIntro", {
          price: JOB_FEATURED_PRICE_SGD,
          days: JOB_FEATURED_DAYS,
        })}
      </p>

      <FormField label={t("fieldPayMethod")}>
        <select
          className={INPUT_CLASS}
          value={method}
          onChange={(e) => setMethod(e.target.value as "kpay" | "wavepay")}
        >
          <option value="kpay">KBZPay</option>
          <option value="wavepay">WavePay</option>
        </select>
      </FormField>

      <FormField label={t("fieldTxnRef")}>
        <input
          className={INPUT_CLASS}
          value={transactionReference}
          onChange={(e) => setTransactionReference(e.target.value)}
          required
          maxLength={120}
        />
      </FormField>

      <FormField label={t("fieldReceipt")}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          disabled={uploading || pending}
          onChange={(e) => void onReceiptChange(e)}
          className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-strong"
        />
        {receiptPath ? (
          <p className="mt-1 text-xs font-medium text-brand-strong">{t("receiptReady")}</p>
        ) : null}
      </FormField>

      {error ? <StatusMessage variant="error">{error}</StatusMessage> : null}

      <Button type="submit" size="sm" disabled={pending || uploading}>
        {pending ? t("submitting") : t("featuredSubmit")}
      </Button>
    </form>
  );
}
