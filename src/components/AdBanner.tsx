"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { trackAdClick, trackAdImpression } from "@/lib/monetization";

type AdBannerProps = {
  placement: string;
  sponsorName?: string;
  headline?: string;
  description?: string;
  ctaText?: string;
  targetUrl?: string;
  /** Optional creative image URL (public storage or absolute URL). */
  imageUrl?: string | null;
};

/**
 * Sponsored content banner with impression + click tracking.
 * Optional image sits above the headline when provided from Admin → Ads.
 */
export default function AdBanner({
  placement,
  sponsorName = "Partner",
  headline = "Support our community",
  description = "This app is free thanks to our sponsors. Consider checking out their services!",
  ctaText = "Learn More",
  targetUrl = "#",
  imageUrl = null,
}: AdBannerProps) {
  const t = useTranslations("ads");
  const { user } = useAuth();
  const hasTrackedImpression = useRef(false);
  const isExternalUrl =
    targetUrl.startsWith("http://") || targetUrl.startsWith("https://");

  useEffect(() => {
    if (hasTrackedImpression.current) {
      return;
    }

    hasTrackedImpression.current = true;

    const timeoutId = setTimeout(() => {
      trackAdImpression({
        userId: user?.id ?? null,
        placement,
        targetUrl,
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [placement, targetUrl, user?.id]);

  const handleClick = () => {
    trackAdClick({
      userId: user?.id ?? null,
      placement,
      targetUrl,
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-warning-border bg-warning-soft">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="h-40 w-full object-cover sm:h-48"
        />
      ) : null}

      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-warning-border/60 px-2 py-0.5 text-xs font-medium text-warning">
            {t("sponsoredLabel")}
          </span>
          <span className="text-xs text-ink-subtle">
            {t("sponsoredBy", { name: sponsorName })}
          </span>
        </div>

        <h3 className="mb-1 font-semibold text-ink">{headline}</h3>
        {description ? (
          <p className="mb-3 text-sm text-ink-muted">{description}</p>
        ) : (
          <div className="mb-3" />
        )}

        <a
          href={targetUrl}
          target={isExternalUrl ? "_blank" : undefined}
          rel={isExternalUrl ? "noopener noreferrer" : undefined}
          onClick={handleClick}
          className="inline-block rounded-lg bg-warning px-4 py-2 text-sm font-medium text-warning-soft transition-colors hover:opacity-90"
        >
          {ctaText}
        </a>

        <p className="mt-2 text-xs text-ink-subtle">{t("transparencyNote")}</p>
      </div>
    </div>
  );
}
