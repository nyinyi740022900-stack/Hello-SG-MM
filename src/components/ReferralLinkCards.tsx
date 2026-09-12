"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { trackAdClick, trackAdImpression } from "@/lib/monetization";
import type { ReferralLinkRow } from "@/lib/accountsGuide";
import {
  isAdminOnlyDescription,
  matchPartnerKey,
  sortReferralsForDisplay,
  type IncomePartnerKey,
} from "@/lib/referralPartnerMatch";

type ReferralLinkCardsProps = {
  links: ReferralLinkRow[];
  affiliateLabel: string;
  invitationLabel: string;
  sponsoredNote: string;
  /** Optional place name for travel destination cards (e.g. Johor Bahru). */
  placeName?: string;
  /** Soft intro under each card CTA. */
  recommendedLabel?: string;
};

const PLACE_BOOKING_KEYS: IncomePartnerKey[] = ["agoda", "trip"];

/**
 * Admin-managed affiliate / invitation cards with click + impression tracking.
 * Prefer tracked income URLs; hide admin paste-instructions from workers.
 */
export default function ReferralLinkCards({
  links,
  affiliateLabel,
  invitationLabel,
  sponsoredNote,
  placeName,
  recommendedLabel,
}: ReferralLinkCardsProps) {
  const { user } = useAuth();
  const tPartners = useTranslations("referralPartners");
  const tracked = useRef<Set<string>>(new Set());

  const ordered = useMemo(() => sortReferralsForDisplay(links), [links]);

  useEffect(() => {
    if (ordered.length === 0) return;
    const timeoutId = setTimeout(() => {
      for (const link of ordered) {
        if (tracked.current.has(link.id)) continue;
        tracked.current.add(link.id);
        trackAdImpression({
          userId: user?.id ?? null,
          placement: `referral_${link.placement}_${link.link_type}`,
          targetUrl: link.url,
        });
      }
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [ordered, user?.id]);

  if (ordered.length === 0) return null;

  return (
    <ul className="space-y-3">
      {ordered.map((link) => {
        const partnerKey = matchPartnerKey(link);
        const isPlaceBooking =
          Boolean(placeName) &&
          partnerKey !== null &&
          PLACE_BOOKING_KEYS.includes(partnerKey);

        let headline = link.title;
        if (isPlaceBooking && link.partner_name) {
          headline = tPartners("placeHotelTitle", {
            partner: link.partner_name,
            place: placeName ?? "",
          });
        } else if (partnerKey && link.partner_name) {
          headline = link.partner_name;
        }

        let body: string | null = null;
        if (partnerKey) {
          body = isPlaceBooking
            ? tPartners("placeHotelHint", { place: placeName ?? "" })
            : tPartners(`benefits.${partnerKey}`);
        } else if (!isAdminOnlyDescription(link.description)) {
          body = link.description;
        }

        const badge =
          link.link_type === "affiliate" ? affiliateLabel : invitationLabel;

        return (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() =>
                trackAdClick({
                  userId: user?.id ?? null,
                  placement: `referral_${link.placement}_${link.link_type}`,
                  targetUrl: link.url,
                })
              }
              className="block overflow-hidden rounded-2xl border border-brand-soft-border bg-gradient-to-br from-brand-soft/80 to-surface p-4 shadow-sm transition hover:border-brand hover:shadow-md"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  {badge}
                </span>
                {recommendedLabel ? (
                  <span className="text-[11px] font-medium text-brand-strong">
                    {recommendedLabel}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-brand-strong">
                    {tPartners("recommended")}
                  </span>
                )}
              </div>

              <p className="text-lg font-semibold text-ink">{headline}</p>
              {body ? (
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{body}</p>
              ) : null}

              <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-strong">
                {link.cta_label || tPartners("openCta")}
                <span aria-hidden="true">→</span>
              </p>
              <p className="mt-1.5 text-[11px] text-ink-subtle">{sponsoredNote}</p>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
