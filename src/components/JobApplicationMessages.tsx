"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import FormField, { INPUT_CLASS } from "@/components/ui/FormField";
import StatusMessage from "@/components/ui/StatusMessage";
import type { JobMessageRow } from "@/lib/jobListings";

type JobApplicationMessagesProps = {
  applicationId: string;
};

export default function JobApplicationMessages({
  applicationId,
}: JobApplicationMessagesProps) {
  const t = useTranslations("jobs");
  const { user } = useAuth();
  const [messages, setMessages] = useState<JobMessageRow[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const response = await fetch(
        `/api/job-listings/messages?applicationId=${encodeURIComponent(applicationId)}`,
      );
      const payload = (await response.json()) as {
        messages?: JobMessageRow[];
        error?: string;
      };
      if (!response.ok) {
        setError(payload.error ?? t("messagesLoadFailed"));
        return;
      }
      setMessages(payload.messages ?? []);
    } catch {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/job-listings/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, body: body.trim() }),
      });
      const payload = (await response.json()) as {
        message?: JobMessageRow;
        error?: string;
      };
      if (!response.ok) {
        setError(payload.error ?? t("messageSendFailed"));
        return;
      }
      if (payload.message) {
        setMessages((prev) => [...prev, payload.message!]);
      }
      setBody("");
    } catch {
      setError(t("networkError"));
    } finally {
      setPending(false);
    }
  }

  async function openCv() {
    setError(null);
    try {
      const response = await fetch("/api/job-listings/cv-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setError(payload.error ?? t("cvOpenFailed"));
        return;
      }
      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch {
      setError(t("networkError"));
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => void openCv()}>
          {t("openCv")}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => void load()}>
          {t("refreshMessages")}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">{t("loadingMessages")}</p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-ink-muted">{t("noMessages")}</p>
      ) : (
        <ul className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-border bg-surface-muted p-3">
          {messages.map((msg) => {
            const mine = msg.sender_id === user.id;
            return (
              <li
                key={msg.id}
                className={`rounded-lg px-3 py-2 text-sm ${
                  mine
                    ? "ml-6 bg-brand-soft text-ink"
                    : "mr-6 bg-surface text-ink border border-border"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.body}</p>
                <p className="mt-1 text-[10px] text-ink-subtle">
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-2">
        <FormField label={t("fieldMessage")}>
          <textarea
            className={INPUT_CLASS}
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            required
          />
        </FormField>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? t("sending") : t("sendMessage")}
        </Button>
      </form>

      {error ? <StatusMessage variant="error">{error}</StatusMessage> : null}
    </div>
  );
}
