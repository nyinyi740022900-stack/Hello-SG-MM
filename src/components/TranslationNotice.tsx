"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

type Variant = "machine" | "notTranslated" | "partial";

/**
 * Tells the reader what they are actually looking at, and gives them a way to
 * say it is wrong.
 *
 * The report button is the point of this component. Four of the six languages
 * have not been read by anyone who speaks them, so a reader noticing a bad
 * translation is currently the only mechanism that could ever surface one.
 * Without a route for that signal, a mistranslation stays live indefinitely.
 */
export default function TranslationNotice({
  variant,
  contentItemId,
}: {
  variant: Variant;
  contentItemId?: string;
}) {
  const t = useTranslations("translation");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    setState("sending");
    try {
      const response = await fetch("/api/translation-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          pagePath: pathname,
          contentItemId,
          note: note.trim() || undefined,
        }),
      });
      setState(response.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  };

  const tone =
    variant === "notTranslated"
      ? "border-border bg-surface-muted text-ink-muted"
      : "border-warning-border bg-warning-soft text-warning";

  const title =
    variant === "machine"
      ? t("machineLabel")
      : variant === "notTranslated"
        ? t("notTranslatedTitle")
        : t("partialTitle");

  const body =
    variant === "machine"
      ? t("machineNote")
      : variant === "notTranslated"
        ? t("notTranslatedBody")
        : t("partialBody");

  return (
    <div className={`rounded-xl border px-3 py-2.5 text-xs ${tone}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 leading-relaxed">{body}</p>

      {state === "sent" ? (
        <p className="mt-2 font-medium">{t("reportThanks")}</p>
      ) : isOpen ? (
        <form onSubmit={send} className="mt-2 flex flex-col gap-2">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t("reportPlaceholder")}
            rows={2}
            maxLength={1000}
            className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-ink outline-none focus:border-brand"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={state === "sending"}
              className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-ink-on-brand disabled:opacity-60"
            >
              {state === "sending" ? t("reportSending") : t("reportSubmit")}
            </button>
            {state === "error" ? (
              <span className="text-danger">{t("reportError")}</span>
            ) : null}
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-2 underline underline-offset-2 hover:opacity-80"
        >
          {t("reportButton")}
        </button>
      )}
    </div>
  );
}
