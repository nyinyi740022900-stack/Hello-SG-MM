"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";
import type { PlaceComment } from "@/lib/placeComments";

/**
 * Initials for a reader with no avatar — never more than two letters.
 *
 * Kept here rather than imported from lib/placeComments: that module builds a
 * Supabase client at import time, and a component that only needs to turn a
 * name into two letters should not drag a database client into the browser
 * bundle to get it.
 */
function initialsFor(displayName: string | null): string {
  const name = displayName?.trim();
  if (!name) return "?";
  const parts = name.split(/\s+/).slice(0, 2);
  return parts.map((p) => [...p][0] ?? "").join("").toUpperCase() || "?";
}

/**
 * Comments under one place.
 *
 * Collapsed by default. The page is long and most readers came for the
 * places, not the conversation — opening every thread on every card would
 * push the next place off the screen and cost data to load avatars nobody
 * asked to see.
 */
export default function PlaceComments({
  placeKey,
  comments,
  count,
}: {
  placeKey: string;
  comments: PlaceComment[];
  count: number;
}) {
  const t = useTranslations("placeComments");
  const { user } = useAuth();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;

    setState("sending");
    setError(null);
    try {
      const response = await fetch("/api/place-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeKey, body: text }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setState("error");
        setError(payload.error ?? t("failed"));
        return;
      }
      setBody("");
      setState("idle");
      router.refresh();
    } catch {
      setState("error");
      setError(t("failed"));
    }
  };

  return (
    <div className="border-t border-border pt-2">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="text-xs font-medium text-brand-strong hover:underline"
      >
        {count > 0 ? t("toggleWithCount", { count }) : t("toggleEmpty")}
      </button>

      {isOpen ? (
        <div className="mt-3 space-y-3">
          {comments.length > 0 ? (
            <ul className="space-y-3">
              {comments.map((comment) => (
                <li key={comment.id} className="flex gap-2.5">
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-[11px] font-semibold text-brand-strong">
                    {comment.author.avatar_url ? (
                      <Image
                        src={comment.author.avatar_url}
                        alt=""
                        width={28}
                        height={28}
                        className="h-7 w-7 object-cover"
                      />
                    ) : (
                      initialsFor(comment.author.display_name)
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink">
                      {comment.author.display_name ?? t("someone")}
                    </p>
                    <p className="whitespace-pre-line text-sm text-ink-muted">
                      {comment.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-subtle">{t("empty")}</p>
          )}

          {user ? (
            <form onSubmit={submit} className="space-y-2">
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={t("placeholder")}
                rows={2}
                maxLength={500}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand"
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={state === "sending" || !body.trim()}
                  className="rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-ink-on-brand disabled:opacity-60"
                >
                  {state === "sending" ? t("sending") : t("post")}
                </button>
                {error ? <span className="text-xs text-danger">{error}</span> : null}
              </div>
              {/* Said before they type, not after they post: a comment here is
                  public, and this audience is targeted by people who read
                  public posts looking for someone to approach. */}
              <p className="text-[11px] text-ink-subtle">{t("safetyNote")}</p>
            </form>
          ) : (
            <p className="text-xs text-ink-subtle">
              <Link href="/login" className="font-medium text-brand-strong underline">
                {t("signInToComment")}
              </Link>
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
