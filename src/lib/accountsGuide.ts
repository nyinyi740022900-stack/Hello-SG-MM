/**
 * Essential accounts a worker needs in Singapore, plus official links and
 * map shortcuts. Partner referral URLs are loaded separately from the DB
 * (admin-managed) so they can change without a code deploy.
 */

export type AccountKey = "bank" | "paynow" | "singpass" | "grabpay";
export type ReferralPlacement = AccountKey | "page" | "remittance" | "travel";
export type ReferralLinkType = "affiliate" | "invitation";

/** Menu / page groups for Admin Referrals UI (non-government income only). */
export type ReferralMenuCategory = "exchange" | "travel" | "accounts";

export const ACCOUNT_KEYS = ["bank", "paynow", "singpass", "grabpay"] as const;
export const REFERRAL_PLACEMENTS = [
  "bank",
  "paynow",
  "singpass",
  "grabpay",
  "page",
  "remittance",
  "travel",
] as const;
export const REFERRAL_LINK_TYPES = ["affiliate", "invitation"] as const;

export const REFERRAL_MENU_CATEGORIES = [
  "exchange",
  "travel",
  "accounts",
] as const;

export const REFERRAL_MENU_CATEGORY_LABELS: Record<ReferralMenuCategory, string> = {
  exchange: "Exchange (ငွေလဲ / ငွေလွှဲ)",
  travel: "Travel (ခရီးသွား)",
  accounts: "Accounts Guide",
};

export const REFERRAL_PLACEMENT_LABELS: Record<ReferralPlacement, string> = {
  bank: "Accounts — Bank",
  paynow: "Accounts — PayNow",
  singpass: "Accounts — Singpass",
  grabpay: "Accounts — GrabPay",
  page: "Accounts — page footer",
  remittance: "Exchange — remittance partners",
  travel: "Travel — eSIM / wallet / booking",
};

/** Where each placement appears in the app menu + public path. */
export const REFERRAL_PLACEMENT_META: Record<
  ReferralPlacement,
  {
    category: ReferralMenuCategory;
    menuPath: string;
    publicPath: string;
    hint: string;
  }
> = {
  remittance: {
    category: "exchange",
    menuPath: "Menu → Exchange",
    publicPath: "/rates",
    hint: "Instarem — paste tracking URL when approved",
  },
  travel: {
    category: "travel",
    menuPath: "Menu → Tools → Travel",
    publicPath: "/travel",
    hint: "Agoda, Trip.com, Airalo, YouTrip — hotels / eSIM / card",
  },
  bank: {
    category: "accounts",
    menuPath: "Menu → Tools → Accounts Guide",
    publicPath: "/accounts-guide",
    hint: "OCBC FRANK, Revolut — bank / wallet signup",
  },
  paynow: {
    category: "accounts",
    menuPath: "Menu → Tools → Accounts Guide",
    publicPath: "/accounts-guide",
    hint: "PayNow section partners (rare)",
  },
  singpass: {
    category: "accounts",
    menuPath: "Menu → Tools → Accounts Guide",
    publicPath: "/accounts-guide",
    hint: "Avoid monetising Singpass — government",
  },
  grabpay: {
    category: "accounts",
    menuPath: "Menu → Tools → Accounts Guide",
    publicPath: "/accounts-guide",
    hint: "GrabPay / wallet partners",
  },
  page: {
    category: "accounts",
    menuPath: "Menu → Tools → Accounts Guide (footer)",
    publicPath: "/accounts-guide",
    hint: "Page-level partners at the bottom of Accounts Guide",
  },
};

export function placementsForCategory(
  category: ReferralMenuCategory,
): ReferralPlacement[] {
  return REFERRAL_PLACEMENTS.filter(
    (p) => REFERRAL_PLACEMENT_META[p].category === category,
  );
}

export type ReferralLinkRow = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  link_type: ReferralLinkType;
  placement: ReferralPlacement;
  cta_label: string;
  partner_name: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export const ACCOUNT_OFFICIAL_LINKS: Record<
  AccountKey,
  { id: string; href: string }[]
> = {
  bank: [
    {
      id: "momSalary",
      href: "https://www.mom.gov.sg/passes-and-permits/work-permit-for-foreign-worker/sector-specific-rules/paying-the-salary",
    },
    {
      id: "momSPassSalary",
      href: "https://www.mom.gov.sg/passes-and-permits/s-pass/paying-salaries",
    },
    { id: "posb", href: "https://www.posb.com.sg/" },
    { id: "dbs", href: "https://www.dbs.com.sg/" },
    { id: "ocbc", href: "https://www.ocbc.com/personal-banking" },
    { id: "uob", href: "https://www.uob.com.sg/" },
  ],
  paynow: [
    { id: "absPayNow", href: "https://www.abs.org.sg/consumer-banking/paynow" },
  ],
  singpass: [
    { id: "singpassHome", href: "https://www.singpass.gov.sg/" },
    { id: "singpassPortal", href: "https://portal.singpass.gov.sg/" },
  ],
  grabpay: [
    { id: "grabPay", href: "https://www.grab.com/sg/pay/" },
    {
      id: "masProviders",
      href: "https://www.mas.gov.sg/regulation/payments/payment-service-providers-list",
    },
  ],
};

export const ACCOUNT_STEP_KEYS: Record<AccountKey, readonly string[]> = {
  bank: ["docs", "employer", "branch", "keepBook"],
  paynow: ["openApp", "linkNumber", "testSend"],
  singpass: ["waitPass", "register", "faceVerify", "app"],
  grabpay: ["download", "topUp", "avoidPayLater"],
};

export const ACCOUNT_MAP_LINKS = [
  {
    id: "posbBranch",
    href: "https://www.google.com/maps/search/?api=1&query=POSB+bank+branch+Singapore",
  },
  {
    id: "dbsBranch",
    href: "https://www.google.com/maps/search/?api=1&query=DBS+bank+branch+Singapore",
  },
  {
    id: "ocbcBranch",
    href: "https://www.google.com/maps/search/?api=1&query=OCBC+bank+branch+Singapore",
  },
  {
    id: "uobBranch",
    href: "https://www.google.com/maps/search/?api=1&query=UOB+bank+branch+Singapore",
  },
  {
    id: "mom",
    href: "https://www.google.com/maps/search/?api=1&query=MOM+Services+Centre+1500+Bendemeer+Road+Singapore+339946",
  },
] as const;

export function isReferralPlacement(value: string): value is ReferralPlacement {
  return (REFERRAL_PLACEMENTS as readonly string[]).includes(value);
}

export function isReferralLinkType(value: string): value is ReferralLinkType {
  return (REFERRAL_LINK_TYPES as readonly string[]).includes(value);
}
