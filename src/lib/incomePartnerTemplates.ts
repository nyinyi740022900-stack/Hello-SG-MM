/**
 * List 1 for income — starter partner templates (non-government).
 * Admin Referrals: grouped by menu category for easy paste of tracking URLs.
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
    id: "remitly",
    title: "Remitly — send money home",
    partnerName: "Remitly",
    description:
      "Licensed remittance. Paste your Remitly affiliate tracking URL, set type to Affiliate.",
    url: "https://www.remitly.com/sg/en",
    applyUrl: "https://www.remitly.com/sg/en/landing/partner-program",
    linkType: "invitation",
    placement: "remittance",
    ctaLabel: "Open Remitly",
    sortOrder: 0,
  },
  {
    id: "worldremit",
    title: "WorldRemit — international transfer",
    partnerName: "WorldRemit",
    description:
      "Remittance option. Paste affiliate tracking URL, set type to Affiliate.",
    url: "https://www.worldremit.com/en/singapore",
    applyUrl: "https://www.worldremit.com/en/partners-and-affiliates",
    linkType: "invitation",
    placement: "remittance",
    ctaLabel: "Open WorldRemit",
    sortOrder: 1,
  },
  {
    id: "agoda",
    title: "Agoda — book hotels",
    partnerName: "Agoda",
    description:
      "Hotels for nearby trips. Paste Agoda affiliate URL, set type to Affiliate.",
    url: "https://www.agoda.com/",
    applyUrl: "https://partners.agoda.com/en-us/",
    linkType: "invitation",
    placement: "travel",
    ctaLabel: "Open Agoda",
    sortOrder: 0,
  },
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
    id: "youtrip",
    title: "YouTrip — multi-currency card",
    partnerName: "YouTrip",
    description:
      "Travel card. Paste YouTrip Creators / referral URL, set type to Affiliate.",
    url: "https://www.you.co/sg/youtrip/",
    applyUrl: "https://www.you.co/sg/youtrip-creators/",
    linkType: "invitation",
    placement: "travel",
    ctaLabel: "Open YouTrip",
    sortOrder: 3,
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
    sortOrder: 4,
  },
  {
    id: "revolut",
    title: "Revolut — account signup",
    partnerName: "Revolut",
    description:
      "Optional wallet. Paste Revolut Impact affiliate URL, set type to Affiliate.",
    url: "https://www.revolut.com/en-SG/",
    applyUrl: "https://www.revolut.com/en-SG/become-a-revolut-affiliate/",
    linkType: "invitation",
    placement: "bank",
    ctaLabel: "Open Revolut",
    sortOrder: 10,
  },
  {
    id: "ocbc-frank",
    title: "OCBC FRANK — bank account",
    partnerName: "OCBC FRANK",
    description:
      "Open FRANK yourself first, then paste your personal MGM referral link.",
    url: "https://www.ocbc.com/personal-banking/cards/frank-debit-card",
    applyUrl: "https://www.ocbc.com/personal-banking/cards/frank-debit-card",
    linkType: "invitation",
    placement: "bank",
    ctaLabel: "Open OCBC FRANK",
    sortOrder: 0,
  },
] as const;

export function templatesForPlacement(
  placement: ReferralPlacement,
): IncomePartnerTemplate[] {
  return INCOME_PARTNER_TEMPLATES.filter((t) => t.placement === placement);
}
