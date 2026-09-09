/**
 * Who to call in Singapore, and what each line is actually for.
 *
 * This page is reached by someone already in trouble, so the numbers matter
 * more than anything else in the app. Every entry below was checked against
 * the operator's own website, and each carries a link back to that page: the
 * hours and terms of a helpline change without notice, and a stale copy of
 * them here would keep someone on hold at a closed line.
 *
 * Two things shape the grouping. First, a worker in danger should not have to
 * read past six NGO names to find 999 — the life-threatening numbers are a
 * separate list rendered first. Second, "call the police" is often the wrong
 * advice for an unpaid salary or a scam, so the rest are grouped by the
 * problem someone would name themselves, not by which agency owns the line.
 */

/** A second channel for someone who cannot safely speak, or cannot speak. */
export type TextChannel = {
  /** Dialled or messaged digits, no spaces. */
  number: string;
  /** Grouped for reading. */
  display: string;
};

export type EmergencyContact = {
  /** Key under the `emergency.contacts` message namespace. */
  id: string;
  /** Digits for `tel:`, no spaces. */
  phone: string;
  /** Grouped for reading, e.g. "1800 339 5505". */
  display: string;
  sms?: TextChannel;
  /**
   * WhatsApp, which is worth surfacing separately: many workers have wifi at
   * their dormitory but no call credit left by the end of the month.
   */
  whatsapp?: TextChannel;
  /** The operator's own page — the final word on hours and services. */
  url?: string;
};

export type EmergencySection = {
  /** Key under the `emergency.sections` message namespace. */
  id: string;
  contacts: EmergencyContact[];
};

/**
 * Life-threatening only. Rendered as large single-tap cards above everything
 * else, with the text fallback attached to each — 70999 is for when speaking
 * would put you in more danger, 70995 is SCDF's line for the deaf and
 * hard-of-hearing community.
 */
export const URGENT_CONTACTS: EmergencyContact[] = [
  {
    id: "police",
    phone: "999",
    display: "999",
    sms: { number: "70999", display: "70999" },
    url: "https://www.police.gov.sg/",
  },
  {
    id: "ambulanceFire",
    phone: "995",
    display: "995",
    sms: { number: "70995", display: "70995" },
    url: "https://www.scdf.gov.sg/home/about-scdf/emergency-medical-services",
  },
];

export const EMERGENCY_SECTIONS: EmergencySection[] = [
  {
    id: "work",
    contacts: [
      {
        id: "momMdw",
        phone: "18003395505",
        display: "1800 339 5505",
        url: "https://www.mom.gov.sg/faq/work-permit-for-fdw/i-am-an-mdw-in-distress",
      },
      {
        id: "mom",
        phone: "+6564385122",
        display: "+65 6438 5122",
        url: "https://www.mom.gov.sg/contact-us",
      },
      {
        id: "mwc",
        phone: "+6565362692",
        display: "+65 6536 2692",
        url: "https://www.mwc.org.sg/how-we-help/24-hour-helpline",
      },
      {
        id: "cde",
        phone: "18002255233",
        display: "1800 225 5233",
        url: "https://www.cde.org.sg/contact-us",
      },
      {
        id: "twc2",
        phone: "18008881515",
        display: "1800 888 1515",
        whatsapp: { number: "6562977564", display: "+65 6297 7564" },
        url: "https://twc2.org.sg/info-for-clients-2021/basic-info-english/",
      },
      {
        id: "home",
        phone: "+6563415535",
        display: "+65 6341 5535",
        whatsapp: { number: "6563415535", display: "+65 6341 5535" },
        url: "https://www.home.org.sg/contact",
      },
      {
        id: "homeMdw",
        phone: "+6597873122",
        display: "+65 9787 3122",
        whatsapp: { number: "6597873122", display: "+65 9787 3122" },
        url: "https://www.home.org.sg/contact",
      },
    ],
  },
  {
    id: "health",
    contacts: [
      {
        id: "healthserve",
        phone: "+6531295000",
        display: "+65 3129 5000",
        url: "https://healthserve.org.sg/mental-health-counselling-services/",
      },
      {
        id: "sos",
        phone: "1767",
        display: "1767",
        whatsapp: { number: "6591511767", display: "+65 9151 1767" },
        url: "https://www.sos.org.sg/contact-us/",
      },
      {
        id: "nurseFirst",
        phone: "+6562626262",
        display: "+65 6262 6262",
        url: "https://www.scdf.gov.sg/home/about-scdf/emergency-medical-services",
      },
      {
        id: "nonEmergencyAmbulance",
        phone: "1777",
        display: "1777",
        url: "https://www.scdf.gov.sg/home/about-scdf/emergency-medical-services",
      },
    ],
  },
  {
    id: "safety",
    contacts: [
      {
        id: "navh",
        phone: "18007770000",
        display: "1800 777 0000",
        url: "https://www.msf.gov.sg/what-we-do/break-the-silence/get-help/i-am-experiencing-abuse",
      },
      {
        id: "scamShield",
        phone: "1799",
        display: "1799",
        url: "https://www.scamshield.gov.sg/check-for-scams/scamshield-helpline/",
      },
      {
        id: "policeHotline",
        phone: "18002550000",
        display: "1800 255 0000",
        url: "https://www.police.gov.sg/",
      },
    ],
  },
];

/**
 * What to have ready before dialling. Rendered as a short list rather than
 * prose because it is read under stress, and the order matters: operators ask
 * for the location first so help can be sent while the rest is still being
 * explained.
 */
export const PREPARE_KEYS = [
  "location",
  "what",
  "identity",
  "interpreter",
  "stay",
  "airtime",
  "save",
] as const;

export function whatsappUrl(number: string): string {
  return `https://wa.me/${number}`;
}

const ALL_CONTACTS: EmergencyContact[] = [
  ...URGENT_CONTACTS,
  ...EMERGENCY_SECTIONS.flatMap((section) => section.contacts),
];

/** Look up a helpline already listed on the Emergency Contacts page. */
export function getEmergencyContact(id: string): EmergencyContact {
  const found = ALL_CONTACTS.find((contact) => contact.id === id);
  if (!found) {
    throw new Error(`[getEmergencyContact] unknown id: ${id}`);
  }
  return found;
}
