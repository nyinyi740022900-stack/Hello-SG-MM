"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import FormField, { INPUT_CLASS } from "@/components/ui/FormField";
import StatusMessage from "@/components/ui/StatusMessage";
import type { AppLocale } from "@/i18n/routing";

type JobApplyFormProps = {
  jobId: string;
  locale: AppLocale;
};

export default function JobApplyForm({ jobId, locale }: JobApplyFormProps) {
  const t = useTranslations("jobs");
  const { user } = useAuth();
  const [coverNote, setCoverNote] = useState("");
  const [cvPath, setCvPath] = useState<string | null>(null);
  const [cvName, setCvName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <p className="text-sm text-ink-muted">
        <Link
          href={{ pathname: "/login", query: { next: `/jobs/${jobId}` } }}
          locale={locale}
          className="font-medium text-brand-strong underline"
        >
          {t("signInToApply")}
        </Link>
      </p>
    );
  }

  async function onCvChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/job-listings/cv-upload", {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as { path?: string; error?: string };
      if (!response.ok || !payload.path) {
        setError(payload.error ?? t("cvUploadFailed"));
        return;
      }
      setCvPath(payload.path);
      setCvName(file.name);
    } catch {
      setError(t("networkError"));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setPending(true);
    try {
      const response = await fetch("/api/job-listings/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          coverNote,
          cvPath,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? t("applyFailed"));
        return;
      }
      setSuccess(true);
      setCoverNote("");
      setCvPath(null);
      setCvName(null);
    } catch {
      setError(t("networkError"));
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return <StatusMessage variant="success">{t("applySuccess")}</StatusMessage>;
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
      <FormField label={t("fieldCoverNote")}>
        <textarea
          className={INPUT_CLASS}
          rows={4}
          value={coverNote}
          onChange={(e) => setCoverNote(e.target.value)}
          required
          minLength={10}
          maxLength={1500}
          placeholder={t("coverNotePlaceholder")}
        />
      </FormField>

      <FormField label={t("fieldCv")}>
        <input
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={uploading || pending}
          onChange={(e) => void onCvChange(e)}
          className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-strong"
        />
        <p className="mt-1 text-xs text-ink-subtle">{t("cvHint")}</p>
        {cvName ? (
          <p className="mt-1 text-xs font-medium text-brand-strong">{cvName}</p>
        ) : null}
      </FormField>

      {error ? <StatusMessage variant="error">{error}</StatusMessage> : null}

      <Button type="submit" disabled={pending || uploading}>
        {pending ? t("submitting") : t("applySubmit")}
      </Button>
    </form>
  );
}
