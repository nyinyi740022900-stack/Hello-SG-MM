/**
 * Match admin referral_links rows to List 1 partner keys so public pages
 * can prefer income URLs over hardcoded official duplicates.
 */

import type { ReferralLinkRow } from "@/lib/accountsGuide";

/** Stable keys used for i18n benefits + URL resolution. */
export type IncomePartnerKey =
  | "agoda"
  | "trip"
  | "airalo"
  | "youtrip"
  | "circles"
  | "revolut"
  | "ocbc-frank";

const PARTNER_ALIASES: Record<IncomePartnerKey, readonly string[]> = {
  agoda: ["agoda"],
  trip: ["trip.com", "ctrip"],
  airalo: ["airalo"],
  youtrip: ["youtrip", "you.co/sg/youtrip"],
  circles: ["circles.life", "circles"],
  revolut: ["revolut"],
  "ocbc-frank": ["ocbc frank", "frank debit"],
};

/** Hub product links that compete with Travel referrals (not government). */
export const TRAVEL_PRODUCT_LINK_KEYS = [
  { id: "airaloHome", partnerKey: "airalo" as const, href: "https://www.airalo.com/" },
  {
    id: "youtripHome",
    partnerKey: "youtrip" as const,
    href: "https://www.you.co/sg/youtrip/",
  },
] as const;

/** Booking website ids covered by Agoda / Trip referrals. */
export const BOOKING_PARTNER_IDS = ["agoda", "trip"] as const;

export function matchPartnerKey(
  link: Pick<ReferralLinkRow, "partner_name" | "title" | "url">,
): IncomePartnerKey | null {
  const hay = `${link.partner_name ?? ""} ${link.title} ${link.url}`.toLowerCase();

  // Trip.com before generic "trip" word matches.
  if (/trip\.com|ctrip/i.test(hay) || /\btrip\b/i.test(link.partner_name ?? "")) {
    return "trip";
  }

  for (const key of Object.keys(PARTNER_ALIASES) as IncomePartnerKey[]) {
    if (key === "trip") continue;
    if (PARTNER_ALIASES[key].some((alias) => hay.includes(alias))) {
      return key;
    }
  }
  return null;
}

/** Prefer affiliate (earning) over invitation when both exist for one partner. */
export function findReferralForPartner(
  links: ReferralLinkRow[],
  partnerKey: IncomePartnerKey,
): ReferralLinkRow | undefined {
  const matches = links.filter((link) => matchPartnerKey(link) === partnerKey);
  return (
    matches.find((link) => link.link_type === "affiliate") ?? matches[0]
  );
}

export function resolvePartnerHref(
  links: ReferralLinkRow[],
  partnerKey: IncomePartnerKey,
  fallbackHref: string,
): string {
  return findReferralForPartner(links, partnerKey)?.url ?? fallbackHref;
}

/** Affiliate first, then sort_order. */
export function sortReferralsForDisplay(
  links: ReferralLinkRow[],
): ReferralLinkRow[] {
  return [...links].sort((a, b) => {
    const aff =
      Number(b.link_type === "affiliate") - Number(a.link_type === "affiliate");
    if (aff !== 0) return aff;
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.title.localeCompare(b.title);
  });
}

/** Hide admin paste-instructions from the public UI. */
export function isAdminOnlyDescription(description: string | null): boolean {
  if (!description?.trim()) return true;
  return /paste|affiliate url|tracking url|set type|invitation or affiliate|admin →/i.test(
    description,
  );
}

/**
 * Booking website fallbacks only for partners without an active referral.
 * App-store links stay as soft fallbacks (no income conflict with city search).
 */
export function bookingFallbacksWithoutReferral(
  links: ReferralLinkRow[],
  bookingApps: readonly { id: string; href: string }[],
): { id: string; href: string }[] {
  const covered = new Set(
    BOOKING_PARTNER_IDS.filter((id) =>
      Boolean(findReferralForPartner(links, id)),
    ),
  );
  return bookingApps.filter((app) => {
    if (app.id === "agoda" || app.id === "trip") return !covered.has(app.id);
    if (app.id === "agodaApp") return !covered.has("agoda");
    if (app.id === "tripApp") return !covered.has("trip");
    return true;
  });
}
