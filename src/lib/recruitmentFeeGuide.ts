export const RECRUITMENT_LINKS = {
  eaDirectory: "https://www.mom.gov.sg/ea-directory",
  eaLicensedFaq:
    "https://www.mom.gov.sg/faq/employment-agencies/why-should-i-work-with-a-licensed-ea-and-how-can-i-check-if-they-are-licensed",
  reportInfringement: "https://www.mom.gov.sg/eservices/services/report-an-infringement/",
  momContact: "https://www.mom.gov.sg/contact-us/phone",
  tadmClaim: "https://www.tal.sg/tadm/eservices/employees-file-employment-claim",
  tadmFees: "https://www.tal.sg/tadm/eservices/filing-fees",
  tadmLocations: "https://www.tal.sg/tadm/locations",
} as const;

export const BEFORE_PAY_KEYS = ["licensed", "personnel", "receipts", "contract", "transfer"] as const;
export const EVIDENCE_KEYS = ["payslips", "bank", "messages", "photos", "timeline"] as const;
export const ACTION_KEYS = ["speak", "report", "claim", "helplines"] as const;

export const SUPPORT_MAP_LINKS = [
  {
    id: "mom",
    href: "https://www.google.com/maps/search/?api=1&query=MOM+Services+Centre+1500+Bendemeer+Road+Singapore+339946",
  },
  {
    id: "tadm",
    href: "https://www.google.com/maps/search/?api=1&query=TADM+MOM+Services+Centre+Hall+A+Level+3+1500+Bendemeer+Road+Singapore+339946",
  },
  {
    id: "mwc",
    href: "https://www.google.com/maps/search/?api=1&query=Migrant+Workers+Centre+Soon+Lee+Street+Singapore",
  },
  {
    id: "home",
    href: "https://www.google.com/maps/search/?api=1&query=HOME+Migrant+Workers+Centre+720+Geylang+Road+Singapore+389631",
  },
] as const;
