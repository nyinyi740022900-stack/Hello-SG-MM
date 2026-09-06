"use client";

import { useEffect, useRef } from "react";

type GoogleAdSlotProps = {
  slot: string;
  className?: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  responsive?: boolean;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Reusable AdSense slot.
 * Renders nothing when AdSense env vars are not configured.
 */
export default function GoogleAdSlot({
  slot,
  className,
  format = "auto",
  responsive = true,
}: GoogleAdSlotProps) {
  const initializedRef = useRef(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !slot || initializedRef.current) {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});
      initializedRef.current = true;
    } catch (error) {
      console.error("[GoogleAdSlot] Failed to initialize ad slot:", error);
    }
  }, [clientId, slot]);

  if (!clientId || !slot) {
    return null;
  }

  return (
    <div
      className={
        className ??
        "rounded-xl border border-border bg-surface p-3 text-center shadow-sm"
      }
    >
      <ins
        className="adsbygoogle block min-h-[90px]"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
