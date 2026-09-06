"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { trackAdClick, trackAdImpression } from "@/lib/monetization";

/**
 * AdBanner Props
 */
type AdBannerProps = {
  /** Where this ad is placed (e.g., 'home_top', 'guide_bottom') */
  placement: string;
  /** Sponsor/advertiser name to display */
  sponsorName?: string;
  /** Ad headline text */
  headline?: string;
  /** Ad description text */
  description?: string;
  /** Call-to-action button text */
  ctaText?: string;
  /** Link the ad points to */
  targetUrl?: string;
};

/**
 * AdBanner Component
 *
 * Displays a sponsored content banner with automatic impression tracking.
 * Tracks clicks when user interacts with the CTA button.
 *
 * Usage:
 * ```tsx
 * <AdBanner
 *   placement="home_top"
 *   sponsorName="ABC Remittance"
 *   headline="Send money home fast"
 *   description="Low fees, quick transfers to Myanmar"
 *   ctaText="Learn More"
 *   targetUrl="https://example.com"
 * />
 * ```
 */
export default function AdBanner({
  placement,
  sponsorName = "Partner",
  headline = "Support our community",
  description = "This app is free thanks to our sponsors. Consider checking out their services!",
  ctaText = "Learn More",
  targetUrl = "#",
}: AdBannerProps) {
  const t = useTranslations("ads");
  const { user } = useAuth();
  const hasTrackedImpression = useRef(false);
  const isExternalUrl = targetUrl.startsWith("http://") || targetUrl.startsWith("https://");

  // Track impression when component mounts and becomes visible
  useEffect(() => {
    if (hasTrackedImpression.current) {
      return;
    }

    hasTrackedImpression.current = true;

    // Small delay to ensure ad is actually visible
    const timeoutId = setTimeout(() => {
      trackAdImpression({
        userId: user?.id ?? null,
        placement,
        targetUrl,
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [placement, targetUrl, user?.id]);

  // Handle CTA click
  const handleClick = () => {
    trackAdClick({
      userId: user?.id ?? null,
      placement,
      targetUrl,
    });
  };

  return (
    <div className="rounded-2xl border border-warning-border bg-warning-soft p-4">
      {/* Sponsored label */}
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-warning-border/60 px-2 py-0.5 text-xs font-medium text-warning">
          {t("sponsoredLabel")}
        </span>
        <span className="text-xs text-ink-subtle">{t("sponsoredBy", { name: sponsorName })}</span>
      </div>

      {/* Ad content */}
      <h3 className="mb-1 font-semibold text-ink">{headline}</h3>
      <p className="mb-3 text-sm text-ink-muted">{description}</p>

      {/* CTA button */}
      <a
        href={targetUrl}
        target={isExternalUrl ? "_blank" : undefined}
        rel={isExternalUrl ? "noopener noreferrer" : undefined}
        onClick={handleClick}
        className="inline-block rounded-lg bg-warning px-4 py-2 text-sm font-medium text-warning-soft transition-colors hover:opacity-90"
      >
        {ctaText}
      </a>

      {/* Transparency note */}
      <p className="mt-2 text-xs text-ink-subtle">
        {t("transparencyNote")}
      </p>
    </div>
  );
}
