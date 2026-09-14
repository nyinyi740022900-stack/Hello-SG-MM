"use client";

import { Pause, Play } from "lucide-react";
import { useRadio, type RadioStation } from "@/context/RadioContext";

/**
 * Play/pause control for a station backed by our own <audio> element (see
 * RadioContext). Using the shared context instead of a local <audio> tag is
 * what lets playback survive navigating to another page.
 */
export default function RadioStationButton({
  station,
  isMy,
}: {
  station: RadioStation;
  isMy: boolean;
}) {
  const { current, isPlaying, toggle } = useRadio();
  const isThisPlaying = current?.id === station.id && isPlaying;
  const isThisCurrent = current?.id === station.id;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => toggle(station)}
        className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-ink-on-brand"
      >
        {isThisPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {isThisPlaying
          ? isMy
            ? "ခဏရပ်ရန်"
            : "Pause"
          : isMy
            ? "နားထောင်ရန်"
            : "Listen"}
      </button>
      {isThisCurrent ? (
        <span className="text-xs text-ink-subtle">
          {isPlaying ? (isMy ? "ဖွင့်နေသည် — LIVE" : "Playing — LIVE") : isMy ? "ခဏရပ်ထား" : "Paused"}
        </span>
      ) : null}
    </div>
  );
}
