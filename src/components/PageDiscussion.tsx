"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";
import AvatarLightbox from "@/components/ui/AvatarLightbox";
import type { PageComment, PageCommentReportReason } from "@/lib/pageComments";
import type { PageDiscussionKey } from "@/lib/pageDiscussionKeys";

function initialsFor(displayName: string | null): string {
  const name = displayName?.trim();
  if (!name) return "?";
  const parts = name.split(/\s+/).slice(0, 2);
  return parts.map((p) => [...p][0] ?? "").join("").toUpperCase() || "?";
}

const REPORT_REASONS: PageCommentReportReason[] = [
  "hate",
  "inappropriate",
  "spam",
  "other",
];

function Avatar({
  name,
  url,
}: {
  name: string | null;
  url: string | null;
}) {
  return (
    <AvatarLightbox
      avatarUrl={url}
      label={name ?? undefined}
      className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-[11px] font-semibold text-brand-strong"
    >
      {url ? (
        <Image src={url} alt="" width={32} height={32} className="h-8 w-8 object-cover" />
      ) : (
        initialsFor(name)
      )}
    </AvatarLightbox>
  );
}

/**
 * Q&A thread for one guide/tool page: comments, one-level replies, report.
 */
export default function PageDiscussion({
  pageKey,
  initialComments,
}: {
  pageKey: PageDiscussionKey;
  initialComments: PageComment[];
}) {
  const t = useTranslations("pageDiscussion");
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const loginHref = pathname ? `/login?next=${encodeURIComponent(pathname)}` : "/login";

  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [reportFor, setReportFor] = useState<string | null>(null);
  const [reportReason, setReportReason] =
    useState<PageCommentReportReason>("inappropriate");
  const [reportDetails, setReportDetails] = useState("");
  const [reportMsg, setReportMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    setDeletingId(id);
    try {
      await fetch(`/api/page-comments?id=${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  const post = async (text: string, parentId: string | null) => {
    setState("sending");
    setError(null);
    try {
      const response = await fetch("/api/page-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageKey, body: text, parentId }),
      });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof (payload as { error: unknown }).error === "string"
            ? (payload as { error: string }).error
            : t("failed");
        setState("error");
        setError(msg);
        return false;
      }
      setState("idle");
      router.refresh();
      return true;
    } catch {
      setState("error");
      setError(t("failed"));
      return false;
    }
  };

  const submitTop = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    const ok = await post(text, null);
    if (ok) setBody("");
  };

  const submitReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!replyTo) return;
    const text = replyBody.trim();
    if (!text) return;
    const ok = await post(text, replyTo);
    if (ok) {
      setReplyBody("");
      setReplyTo(null);
    }
  };

  const submitReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reportFor) return;
    setReportMsg(null);
    try {
      const response = await fetch("/api/page-comments/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId: reportFor,
          reason: reportReason,
          details: reportDetails.trim() || null,
        }),
      });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof (payload as { error: unknown }).error === "string"
            ? (payload as { error: string }).error
            : t("reportFailed");
        setReportMsg(msg);
        return;
      }
      setReportMsg(t("reportThanks"));
      setReportDetails("");
      window.setTimeout(() => {
        setReportFor(null);
        setReportMsg(null);
      }, 1500);
    } catch {
      setReportMsg(t("reportFailed"));
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
      <div>
        <h3 className="font-semibold text-ink">{t("title")}</h3>
        <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>
      </div>

      {user ? (
        <form onSubmit={submitTop} className="space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("placeholder")}
            rows={3}
            maxLength={800}
            className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm text-ink outline-none focus:border-brand"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={state === "sending" || !body.trim()}
              className="rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-ink-on-brand disabled:opacity-60"
            >
              {state === "sending" ? t("sending") : t("post")}
            </button>
            {error && !replyTo ? (
              <span className="text-xs text-danger">{error}</span>
            ) : null}
          </div>
          <p className="text-[11px] text-ink-subtle">{t("safetyNote")}</p>
        </form>
      ) : (
        <p className="text-sm text-ink-subtle">
          <Link href={loginHref} className="font-medium text-brand-strong underline">
            {t("signInToComment")}
          </Link>
        </p>
      )}

      {initialComments.length === 0 ? (
        <p className="text-sm text-ink-subtle">{t("empty")}</p>
      ) : (
        <ul className="space-y-4">
          {initialComments.map((comment) => (
            <li key={comment.id} className="space-y-3">
              <div className="flex gap-2.5">
                <Avatar
                  name={comment.author.display_name}
                  url={comment.author.avatar_url}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-ink">
                    {comment.author.display_name ?? t("someone")}
                  </p>
                  <p className="whitespace-pre-line text-sm text-ink-muted">
                    {comment.body}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-3">
                    {user ? (
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTo(comment.id);
                          setReplyBody("");
                          setError(null);
                        }}
                        className="text-xs font-semibold text-brand-strong hover:underline"
                      >
                        {t("reply")}
                      </button>
                    ) : null}
                    {user ? (
                      <button
                        type="button"
                        onClick={() => {
                          setReportFor(comment.id);
                          setReportMsg(null);
                        }}
                        className="text-xs font-medium text-ink-subtle hover:text-danger hover:underline"
                      >
                        {t("report")}
                      </button>
                    ) : null}
                    {user?.id === comment.author_id ? (
                      <button
                        type="button"
                        onClick={() => void handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        className="text-xs font-medium text-ink-subtle hover:text-danger hover:underline disabled:opacity-60"
                      >
                        {t("delete")}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {comment.replies.length > 0 ? (
                <ul className="ml-6 space-y-3 border-l border-border pl-3 sm:ml-10">
                  {comment.replies.map((reply) => (
                    <li key={reply.id} className="flex gap-2.5">
                      <Avatar
                        name={reply.author.display_name}
                        url={reply.author.avatar_url}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-ink">
                          {reply.author.display_name ?? t("someone")}
                        </p>
                        <p className="whitespace-pre-line text-sm text-ink-muted">
                          {reply.body}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-3">
                          {user ? (
                            <button
                              type="button"
                              onClick={() => {
                                setReportFor(reply.id);
                                setReportMsg(null);
                              }}
                              className="text-xs font-medium text-ink-subtle hover:text-danger hover:underline"
                            >
                              {t("report")}
                            </button>
                          ) : null}
                          {user?.id === reply.author_id ? (
                            <button
                              type="button"
                              onClick={() => void handleDelete(reply.id)}
                              disabled={deletingId === reply.id}
                              className="text-xs font-medium text-ink-subtle hover:text-danger hover:underline disabled:opacity-60"
                            >
                              {t("delete")}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}

              {replyTo === comment.id && user ? (
                <form onSubmit={submitReply} className="ml-6 space-y-2 sm:ml-10">
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder={t("replyPlaceholder")}
                    rows={2}
                    maxLength={800}
                    className="w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm text-ink outline-none focus:border-brand"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={state === "sending" || !replyBody.trim()}
                      className="rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-ink-on-brand disabled:opacity-60"
                    >
                      {state === "sending" ? t("sending") : t("postReply")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyTo(null)}
                      className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-ink-muted"
                    >
                      {t("cancel")}
                    </button>
                    {error ? <span className="text-xs text-danger">{error}</span> : null}
                  </div>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {reportFor ? (
        <form
          onSubmit={submitReport}
          className="space-y-3 rounded-xl border border-warning-border bg-warning-soft p-3"
        >
          <p className="text-sm font-semibold text-ink">{t("reportTitle")}</p>
          <div className="flex flex-wrap gap-2">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => setReportReason(reason)}
                className={[
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  reportReason === reason
                    ? "bg-warning text-warning-soft"
                    : "border border-border bg-surface text-ink-muted",
                ].join(" ")}
              >
                {reason === "hate"
                  ? t("reasonHate")
                  : reason === "inappropriate"
                    ? t("reasonInappropriate")
                    : reason === "spam"
                      ? t("reasonSpam")
                      : t("reasonOther")}
              </button>
            ))}
          </div>
          <textarea
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            placeholder={t("reportDetailsPlaceholder")}
            rows={2}
            maxLength={400}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-xl bg-warning px-3 py-1.5 text-xs font-semibold text-warning-soft"
            >
              {t("reportSubmit")}
            </button>
            <button
              type="button"
              onClick={() => setReportFor(null)}
              className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-ink-muted"
            >
              {t("cancel")}
            </button>
          </div>
          {reportMsg ? <p className="text-xs text-ink">{reportMsg}</p> : null}
        </form>
      ) : null}
    </section>
  );
}
