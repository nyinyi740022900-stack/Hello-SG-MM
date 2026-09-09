/**
 * Rest-day rights in Singapore, split by who the reader actually is.
 *
 * Domestic workers and Work Permit holders live under different laws. Mixing
 * them — as this page once did — sends a construction worker a maid's 2023
 * rule, and sends a maid an Employment Act pay table that does not apply to
 * her. Every fact below is therefore tagged to one of those two regimes, and
 * every block carries a link back to MOM's own page.
 */

export const REST_DAY_LINKS = {
  mdwWellbeing:
    "https://www.mom.gov.sg/passes-and-permits/work-permit-for-foreign-domestic-worker/employers-guide/rest-days-and-well-being",
  mdwPayFaq:
    "https://www.mom.gov.sg/faq/work-permit-for-fdw/how-do-i-calculate-my-fdws-pay-in-lieu-of-a-weekly-rest-day",
  mdwRestDayGuide:
    "https://www.mom.gov.sg/-/media/mom/documents/publications/guides/migrant-domestic-worker-rest-day-guide.pdf",
  mdwHandyBurmese:
    "https://www.mom.gov.sg/-/media/mom/documents/publications/guides/mdw-handy-guide-english-burmese.pdf",
  employmentActRest:
    "https://www.mom.gov.sg/employment-practices/hours-of-work-overtime-and-rest-days",
  reportInfringement: "https://www.mom.gov.sg/eservices/services/report-an-infringement/",
  tadm: "https://www.tal.sg/tadm",
  pressRelease: "https://www.mom.gov.sg/newsroom/press-releases/2022/1007-mandatory-rest-days-for-mdws",
} as const;

/** Helpline ids from emergencyContacts.ts — same numbers, one source. */
export const REST_DAY_HELPLINE_IDS = ["momMdw", "cde", "mwc", "homeMdw"] as const;

export const MDW_FACT_KEYS = [
  "weekly",
  "agreeDay",
  "mandatoryOne",
  "compensation",
  "written",
  "enforcement",
] as const;

export const MDW_FLEX_KEYS = ["anyDay", "halfDays", "stayHome", "defer"] as const;

/**
 * MOM's own worked example (last updated March 2026): monthly salary divided
 * by 26, not by the number of days in that month.
 */
export const MDW_PAY_EXAMPLE = {
  monthlySalary: 650,
  divisor: 26,
  dayRate: 25,
} as const;

export const WP_FACT_KEYS = [
  "weekly",
  "wholeDay",
  "maxGap",
  "roster",
  "cannotCompel",
  "employerPay",
  "noTimeOff",
] as const;

export const IF_DENIED_KEYS = ["call", "report", "centre", "salary", "danger"] as const;
