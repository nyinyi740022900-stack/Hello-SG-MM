/**
 * Remittance / send-money guide content for the Exchange (/rates) page.
 * Copy lives in messages under rates.*; URLs and order live here.
 */

export const SAFE_SEND_KEYS = [
  "compareTotal",
  "checkLicence",
  "confirmRate",
  "keepReceipt",
  "avoidAgent",
] as const;

export const CHANNEL_KEYS = ["bank", "licensed", "shop", "app"] as const;

export const MISTAKE_KEYS = [
  "mistakeUnlicensed",
  "mistakeCashStranger",
  "mistakeIgnoreFee",
  "mistakeNoReceipt",
  "mistakeFakeRate",
] as const;

/** Official and regulator links. */
export const OFFICIAL_LINKS = [
  {
    id: "masFid",
    href: "https://eservices.mas.gov.sg/fid",
  },
  {
    id: "masProviders",
    href: "https://www.mas.gov.sg/regulation/payments/payment-service-providers-list",
  },
  {
    id: "momSalary",
    href: "https://www.mom.gov.sg/passes-and-permits/work-permit-for-foreign-worker/sector-specific-rules/paying-the-salary",
  },
] as const;

/** Google Maps for common remittance / money-changer areas in Singapore. */
export const HUB_MAPS = [
  {
    id: "peninsula",
    href: "https://www.google.com/maps/search/?api=1&query=Peninsula+Plaza+Singapore+money+changer",
  },
  {
    id: "littleIndia",
    href: "https://www.google.com/maps/search/?api=1&query=Little+India+Singapore+remittance",
  },
  {
    id: "mustafa",
    href: "https://www.google.com/maps/search/?api=1&query=Mustafa+Centre+Singapore",
  },
  {
    id: "chinatown",
    href: "https://www.google.com/maps/search/?api=1&query=Chinatown+Singapore+money+changer",
  },
] as const;
