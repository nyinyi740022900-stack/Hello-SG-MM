"use client";

import { useLocale } from "next-intl";
import { Pause, Play, X } from "lucide-react";
import { useRadio } from "@/context/RadioContext";

/**
 * Floats above every page (mounted once in the locale layout) so a station
 * started on /radio keeps playing while the reader browses elsewhere.
 * Renders nothing once no station has ever been picked.
 */
export default function RadioMiniPlayer() {
  const locale = useLocale();
  const isMy = locale === "my";
  const { current, isPlaying, toggle, stop } = useRadio();

  if (!current) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface px-4 py-2 shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${isPlaying ? "animate-pulse bg-danger" : "bg-ink-subtle"}`}
            aria-hidden="true"
          />
          <span className="truncate text-sm font-medium text-ink">{current.name}</span>
          <span className="shrink-0 text-xs text-ink-subtle">
            {isPlaying ? (isMy ? "ဖွင့်နေသည်" : "Playing") : isMy ? "ခဏရပ်ထား" : "Paused"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => toggle(current)}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-ink-on-brand"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={stop}
            aria-label={isMy ? "ပိတ်ရန်" : "Close"}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-subtle hover:bg-surface-muted hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
