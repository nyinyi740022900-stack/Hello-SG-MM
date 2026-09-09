/**
 * Myanmar passport renewal at the embassy in Singapore: what to bring, what
 * it costs, and how to get through the door.
 *
 * Everything here comes from the embassy's own consular page and homepage,
 * because this is the one procedure in the app where being wrong wastes a
 * worker's rest day. A Work Permit holder gets one day off a week; being
 * turned away for a missing second photocopy costs them the whole week.
 *
 * Which is also why the copy counts, the cash-only rule and the 8.30–12.00
 * submission window are stated as facts rather than left implied. The
 * embassy rejects applications outright when an original is missing, so the
 * page has to be specific enough to be checked against a pile of paper the
 * night before.
 *
 * Only the stable parts live here. Fees change, appointment channels change,
 * and the approved-applicant list changes weekly, so every block on the page
 * carries a link back to the embassy's own page for the current version.
 */

import type { CountryCode } from "@/lib/countries";

const CONSULAR_DOWNLOAD = "http://www.myanmarembassy.sg/downloads/consular";

/** The embassy's own pages — the final word on all of this. */
export const EMBASSY_LINKS = {
  /** Requirements and the downloadable form for every pass type. */
  consular: "http://www.myanmarembassy.sg/consular.html",
  /** Homepage, where the weekly approved-applicant list is published. */
  appointmentList: "http://www.myanmarembassy.sg/",
  contact: "http://www.myanmarembassy.sg/contact-us.html",
  maps: "https://www.google.com/maps/search/?api=1&query=15+St+Martin%27s+Drive+Singapore+257996",
  /** Lodge a Singapore police report — required before a lost-passport application. */
  policeReport: "https://www.police.gov.sg/e-services/lodge-police-report",
  labourNotice: "http://www.myanmarembassy.sg/downloads/Ministryoflabour-Annoucement.pdf",
} as const;

export const EMBASSY_ADDRESS = "15 St Martin's Drive, Singapore 257996";

export type EmbassyPhone = {
  /** Key under `checklist.embassyContact.phones`. */
  id: string;
  phone: string;
  display: string;
};

export const EMBASSY_PHONES: EmbassyPhone[] = [
  {
    id: "consular",
    phone: "+6567352035",
    display: "+65 6735 2035",
  },
  {
    id: "visa",
    phone: "+6567353164",
    display: "+65 6735 3164",
  },
];

/**
 * Appointments are taken on WhatsApp, split by which pass you hold — the
 * website booking system was suspended in 2024 after people were charged
 * for "help" getting a slot. Sending a Work Permit holder to the wrong
 * number means no reply and no appointment.
 */
export type AppointmentChannel = {
  /** Key under `checklist.appointment.channels` — which passes it covers. */
  id: string;
  /** Digits for wa.me, no plus or spaces. */
  whatsapp: string;
  display: string;
};

export const APPOINTMENT_CHANNELS: AppointmentChannel[] = [
  {
    id: "longTermPasses",
    whatsapp: "6581748993",
    display: "+65 8174 8993",
  },
  {
    id: "workPermit",
    whatsapp: "6582468581",
    display: "+65 8246 8581",
  },
];

/** Ordered as someone would do them, not as the embassy lists them. */
export const APPOINTMENT_STEP_KEYS = [
  "chooseNumber",
  "sendCopies",
  "onePerPhone",
  "dontRepeat",
  "checkList",
  "comeOnDate",
] as const;

/** Needed by every applicant, whatever pass they hold. */
export const DOCUMENT_KEYS = [
  "form",
  "photo",
  "passport",
  "passCard",
  "myanmarIc",
  "taxReceipt",
  "cash",
] as const;

/** Extra papers that depend on who the applicant is. */
export const SITUATION_KEYS = [
  "dependent",
  "student",
  "seaman",
  "permanentResident",
  "pjType",
  "airTicketDeposit",
] as const;

/** How the counter actually runs: windows, payment, waiting. */
export const VISIT_KEYS = [
  "gettingThere",
  "submission",
  "collection",
  "cashOnly",
  "noPhotoService",
  "originals",
  "enquiryCalls",
] as const;

/**
 * Published fees, in Singapore dollars and cash only.
 *
 * The embassy lists these as a base fee plus surcharges; the totals are what
 * someone has to bring in their pocket, so the totals are what we show.
 */
export type RenewalFee = {
  /** Key under `checklist.fees.items`. */
  id: string;
  amount: string;
};

export const RENEWAL_FEES: RenewalFee[] = [
  { id: "renewal", amount: "S$65" },
  { id: "earlyRenewal", amount: "S$110" },
  { id: "expiredOrDamaged", amount: "S$100" },
  { id: "expiredOverTwoYears", amount: "S$125" },
  { id: "lost", amount: "S$190" },
  { id: "certificateOfIdentity", amount: "S$20" },
  { id: "letters", amount: "S$10" },
];

export const OTHER_FEES: RenewalFee[] = [
  { id: "newbornRecommendation", amount: "S$25" },
  { id: "renounceLetter", amount: "S$25" },
  { id: "legalisation", amount: "S$50" },
];

/** The tax receipt trips people up, so its own short document list. */
export const TAX_DOCUMENT_KEYS = [
  "taxForm",
  "passportCopy",
  "singaporeIcCopy",
  "myanmarIcCopy",
] as const;

/** A lost passport is a different application with a police report first. */
export const LOST_PASSPORT_KEYS = [
  "policeReport",
  "twoForms",
  "oldPassportCopies",
  "householdList",
  "taxReceipt",
  "seaman",
  "airTicketDeposit",
  "certificateOfIdentity",
] as const;

/**
 * Official embassy PDFs. The two we host locally (general / maid) are copies
 * of these; linking here as well means a worker can still get the form if our
 * hosted copy is behind, and can get the other services' forms we do not host.
 */
export type EmbassyForm = {
  /** Key under `checklist.forms.items`. */
  id: string;
  url: string;
};

export const EMBASSY_FORMS: EmbassyForm[] = [
  { id: "general", url: `${CONSULAR_DOWNLOAD}/RenewPassport-V1.pdf` },
  { id: "maid", url: `${CONSULAR_DOWNLOAD}/RenewPassport-V2.pdf` },
  { id: "lost", url: `${CONSULAR_DOWNLOAD}/LossPassport.pdf` },
  { id: "tax", url: `${CONSULAR_DOWNLOAD}/IncomeTax.pdf` },
  { id: "newborn", url: `${CONSULAR_DOWNLOAD}/NewBornPassport.pdf` },
  { id: "seamanToShore", url: `${CONSULAR_DOWNLOAD}/SeamanToShorejob.pdf` },
  { id: "coi", url: `${CONSULAR_DOWNLOAD}/ApplicationFormCI-NEWBORN.pdf` },
  { id: "dependent", url: `${CONSULAR_DOWNLOAD}/Dependent.pdf` },
  { id: "airTicketDeposit", url: `${CONSULAR_DOWNLOAD}/ReturnAirTicketDeposit.pdf` },
  { id: "airTicketRefund", url: `${CONSULAR_DOWNLOAD}/ReturnAirTicketRefund.pdf` },
];

/**
 * Consular jobs that are not a standard renewal. Each has a form on the
 * embassy site; the document list lives in translations so it can be as long
 * as the embassy's own list without inventing extra steps.
 */
export type OtherService = {
  /** Key under `checklist.otherServices.items`. */
  id: string;
  formId: EmbassyForm["id"] | null;
};

export const OTHER_SERVICES: OtherService[] = [
  { id: "newborn", formId: "newborn" },
  { id: "seamanToShore", formId: "seamanToShore" },
  { id: "coi", formId: "coi" },
  { id: "dependentLetter", formId: "dependent" },
  { id: "airTicketDeposit", formId: "airTicketDeposit" },
  { id: "airTicketRefund", formId: "airTicketRefund" },
  { id: "legalisation", formId: null },
];

/** Packed the night before, in the order someone would stack the pile. */
export const PREPARE_KEYS = [
  "formSigned",
  "copies",
  "photo",
  "cash",
  "originals",
  "appointmentName",
] as const;

/**
 * For readers whose country we have not checked document-by-document. We
 * send them to the mission's own appointment and form pages rather than
 * reprinting a procedure we have never verified.
 */
export type OtherCountryLink = {
  /** Key under `checklist.otherCountries.links`. */
  id: string;
  url: string;
};

export const OTHER_COUNTRY_PASSPORT_LINKS: Record<
  Exclude<CountryCode, "mm">,
  OtherCountryLink[]
> = {
  in: [
    { id: "bls", url: "https://www.blsinternational.com/india/singapore/" },
    {
      id: "renewal",
      url: "https://www.blsinternational.com/india/singapore/renewal-passport.php",
    },
    { id: "mission", url: "https://www.hcisingapore.gov.in/" },
  ],
  cn: [
    { id: "consular", url: "https://sg.china-embassy.gov.cn/eng/lsfwx/" },
    { id: "mission", url: "https://sg.china-embassy.gov.cn/eng/" },
  ],
  bd: [
    { id: "appointment", url: "https://eappointment.bdhc.sg/" },
    { id: "epassport", url: "https://www.epassport.gov.bd/" },
    {
      id: "rules",
      url: "https://singapore.mofa.gov.bd/en/site/page/E-passport-application-rules",
    },
  ],
  my: [
    {
      id: "renewal",
      url: "https://www.kln.gov.my/web/sgp_singapore/passport_renewal",
    },
    { id: "mission", url: "https://www.kln.gov.my/web/sgp_singapore/home" },
  ],
};

export const OTHER_COUNTRY_STEP_KEYS = ["start", "book", "confirm"] as const;
