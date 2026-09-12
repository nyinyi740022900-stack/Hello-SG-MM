/**
 * Stable page keys for Q&A discussions under guide / tool screens.
 * Keep in sync with where <PageDiscussionSection /> is mounted.
 */

export const PAGE_DISCUSSION_KEYS = [
  "guide",
  "passport-checklist",
  "passport-wizard",
  "rest-day-rights",
  "accounts-guide",
  "off-day-guide",
  "recruitment-fee",
  "transport",
  "travel",
  "travel-jb",
  "travel-melaka",
  "travel-batam",
  "travel-bintan",
  "travel-bangkok",
  "travel-phuket",
  "driving-license",
  "lottery",
  "rates",
  "emergency-contacts",
  "salary-log",
  "help",
  "events",
  "directory",
] as const;

export type PageDiscussionKey = (typeof PAGE_DISCUSSION_KEYS)[number];

export const PAGE_DISCUSSION_LABELS: Record<PageDiscussionKey, string> = {
  guide: "Passport guide",
  "passport-checklist": "Passport checklist",
  "passport-wizard": "Passport wizard",
  "rest-day-rights": "Rest day rights",
  "accounts-guide": "Accounts guide",
  "off-day-guide": "Off-day guide",
  "recruitment-fee": "Recruitment fee",
  transport: "Transport",
  travel: "Travel hub",
  "travel-jb": "Travel — Johor Bahru",
  "travel-melaka": "Travel — Melaka",
  "travel-batam": "Travel — Batam",
  "travel-bintan": "Travel — Bintan",
  "travel-bangkok": "Travel — Bangkok",
  "travel-phuket": "Travel — Phuket",
  "driving-license": "Driving licence",
  lottery: "Lottery",
  rates: "Exchange rates",
  "emergency-contacts": "Emergency contacts",
  "salary-log": "Salary log",
  help: "Help",
  events: "Events",
  directory: "Directory",
};

export function isPageDiscussionKey(value: string): value is PageDiscussionKey {
  return (PAGE_DISCUSSION_KEYS as readonly string[]).includes(value);
}
