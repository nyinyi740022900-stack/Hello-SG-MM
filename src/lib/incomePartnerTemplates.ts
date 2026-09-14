/**
 * List 1 for income — starter partner templates (non-government).
 * Admin Referrals: grouped by menu category for easy paste of tracking URLs.
 *
 * Kept to the partners actually registered for (Trip.com, Airalo,
 * Circles.Life) rather than every program that could theoretically fit —
 * a listed "apply" link nobody has signed up to earn from is just noise.
 */

import type { ReferralLinkType, ReferralPlacement } from "@/lib/accountsGuide";

export type IncomePartnerTemplate = {
  id: string;
  title: string;
  partnerName: string;
  description: string;
  /** Public product URL until you paste your tracked affiliate URL. */
  url: string;
  /** Where the owner applies for the affiliate / creators program. */
  applyUrl: string;
  linkType: ReferralLinkType;
  placement: ReferralPlacement;
  ctaLabel: string;
  sortOrder: number;
};

export const INCOME_PARTNER_TEMPLATES: readonly IncomePartnerTemplate[] = [
  {
    id: "trip",
    title: "Trip.com — hotels & flights",
    partnerName: "Trip.com",
    description:
      "Hotels and flights. Paste Trip.com affiliate URL, set type to Affiliate.",
    url: "https://www.trip.com/",
    applyUrl: "https://www.trip.com/partners/",
    linkType: "invitation",
    placement: "travel",
    ctaLabel: "Open Trip.com",
    sortOrder: 1,
  },
  {
    id: "airalo",
    title: "Airalo — travel eSIM",
    partnerName: "Airalo",
    description:
      "Travel eSIM. Paste Airalo Impact affiliate URL, set type to Affiliate.",
    url: "https://www.airalo.com/",
    applyUrl: "https://www.airalo.com/m/resources/airalo-affiliate-program",
    linkType: "invitation",
    placement: "travel",
    ctaLabel: "Get eSIM",
    sortOrder: 2,
  },
  {
    id: "circles",
    title: "Circles.Life — Singapore SIM",
    partnerName: "Circles.Life",
    description:
      "Optional SG SIM. Paste Involve Asia / Circles affiliate URL, set type to Affiliate.",
    url: "https://www.circles.life/sg/",
    applyUrl: "https://involve.asia/",
    linkType: "invitation",
    placement: "travel",
    ctaLabel: "Open Circles.Life",
    sortOrder: 3,
  },
] as const;

export function templatesForPlacement(
  placement: ReferralPlacement,
): IncomePartnerTemplate[] {
  return INCOME_PARTNER_TEMPLATES.filter((t) => t.placement === placement);
}
