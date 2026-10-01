"use client";

import { MoreHorizontal } from "lucide-react";

/**
 * "More" tile at the end of the home shortcuts rail.
 *
 * It doesn't navigate anywhere — the full tool list already lives in the
 * nav drawer (AppNav), so this just opens that drawer rather than
 * duplicating its contents as a destination page. A plain DOM event is the
 * simplest way for a Server Component (the home page) to trigger state in a
 * distant client component (AppNav) without threading props or context
 * through everything in between.
 */
export default function SeeAllShortcut({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("hellosgmm:open-nav"))}
      className="flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-lg px-1 py-1 text-center transition hover:opacity-80"
    >
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-border-strong bg-surface-muted text-ink-muted">
        <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="line-clamp-2 text-xs leading-tight text-ink-muted">{label}</span>
    </button>
  );
}
