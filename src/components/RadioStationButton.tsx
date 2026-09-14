"use client";

import { LoaderCircle, Pause, Play } from "lucide-react";
import { useRadio, type RadioStation } from "@/context/RadioContext";

/**
 * Play/pause control for a station backed by our own <audio> element (see
 * RadioContext). Using the shared context instead of a local <audio> tag is
 * what lets playback survive navigating to another page.
 *
 * These streams are small third-party relays we do not control, so a
 * connection can fail — surfacing that as a message with a link to the
 * station's own site is what keeps a failed connection from just looking
 * like a broken button.
 */
export default function RadioStationButton({
  station,
  isMy,
  websiteUrl,
}: {
  station: RadioStation;
  isMy: boolean;
  /** Shown as a fallback link if the stream fails to connect. */
  websiteUrl?: string;
}) {
  const { current, status, toggle } = useRadio();
  const isThisCurrent = current?.id === station.id;
  const thisStatus = isThisCurrent ? status : "idle";

  const label =
    thisStatus === "loading"
      ? isMy
        ? "ချိတ်ဆက်နေသည်…"
        : "Connecting…"
      : thisStatus === "playing"
        ? isMy
          ? "ခဏရပ်ရန်"
          : "Pause"
        : thisStatus === "error"
          ? isMy
            ? "ပြန်စမ်းရန်"
            : "Retry"
          : isMy
            ? "နားထောင်ရန်"
            : "Listen";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => toggle(station)}
          disabled={thisStatus === "loading"}
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-ink-on-brand disabled:opacity-70"
        >
          {thisStatus === "loading" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : thisStatus === "playing" ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {label}
        </button>
        {thisStatus === "playing" ? (
          <span className="text-xs text-ink-subtle">LIVE</span>
        ) : null}
      </div>
      {thisStatus === "error" ? (
        <p className="text-xs text-danger">
          {isMy
            ? "ချိတ်ဆက်လို့ မရပါ — network ပြဿနာ ဒါမှမဟုတ် ဘူတာ ခဏရပ်နေခြင်း ဖြစ်နိုင်ပါသည်။"
            : "Could not connect — this may be a network issue or the station being briefly down."}
          {websiteUrl ? (
            <>
              {" "}
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-strong underline"
              >
                {isMy ? "ကိုယ်ပိုင် site တွင် စမ်းကြည့်ပါ" : "Try their own site"}
              </a>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
