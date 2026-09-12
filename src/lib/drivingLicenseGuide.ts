/**
 * Singapore driving licence guide — conversion, tests, training, centres, vocational.
 * Copy lives in messages; URLs and section order live here.
 */

export const OVERVIEW_KEYS = ["shortStay", "longStay", "asean", "eligibility"] as const;

export const CONVERT_STEP_KEYS = [
  "passBtt",
  "gatherDocs",
  "preAssessment",
  "appointment",
  "payCollect",
] as const;

export const DOC_KEYS = [
  "passportPass",
  "foreignLicence",
  "translation",
  "photo",
  "residencyProof",
  "wpHistory",
] as const;

export const TEST_KEYS = ["btt", "ftt", "rtt", "practical", "booking"] as const;

export const PASS_MARK_KEYS = [
  "theoryScore",
  "theoryFormat",
  "practicalDemerit",
  "fttWindow",
  "rttWindow",
] as const;

export const DEMERIT_KEYS = [
  "whatIsDips",
  "probationYear",
  "pPlate",
  "probationLimit",
  "fullLicenceLimit",
  "change2027",
  "afterRevoke",
] as const;

export const FINE_KEYS = [
  "seatbelt",
  "speedLow",
  "speedMid",
  "redLight",
  "phone",
  "signal",
  "noteAmounts",
] as const;

export const CLASS_KEYS = ["class3", "class3a", "class3c", "class2b"] as const;

export const LEARNER_KEYS = [
  "enrolCentre",
  "bttPdl",
  "lessonsFtt",
  "practical",
  "qdl",
] as const;

export const TRAINING_KEYS = [
  "chooseCentre",
  "theoryPractice",
  "practicalHours",
  "feesVary",
  "keepReceipts",
] as const;

export const VOCATIONAL_KEYS = [
  "pdvlCitizenOnly",
  "tdvlCitizenOnly",
  "odvlBus",
  "checkOfficial",
] as const;

export const MISTAKE_KEYS = [
  "mistakeDriveExpired",
  "mistakeSkipBtt",
  "mistakeNoTranslation",
  "mistakePdvlHope",
  "mistakeOutdatedBlog",
  "mistakePayAgent",
  "mistakeDemerit",
] as const;

/** Official documents, handbooks, booking and centre sites. */
export const OFFICIAL_LINKS = [
  {
    id: "tpConvert",
    href: "https://www.police.gov.sg/E-Services/Book-Appointment-to-Convert-Foreign-Driving-Licence",
  },
  {
    id: "tpDocChecklist",
    href: "https://www.police.gov.sg/-/media/SPF/Advisories/Checklist-of-Documents-for-Conversion-of-Other-Foreign-Driving-Licence.pdf",
  },
  {
    id: "tpBttHandbook",
    href: "https://www.police.gov.sg/-/media/Spf/Advisories/BTTENG2024.ashx",
  },
  {
    id: "tpCheckDips",
    href: "https://www.police.gov.sg/E-Services/Check-Driver-Improvement-Points",
  },
  {
    id: "oneMotoringDriving",
    href: "https://onemotoring.lta.gov.sg/content/onemotoring/home/driving.html",
  },
  {
    id: "oneMotoringVl",
    href: "https://onemotoring.lta.gov.sg/content/onemotoring/home/driving/vocational_licence/vocational_licence_application.html",
  },
  {
    id: "gobusinessPdvl",
    href: "https://licensing.gobusiness.gov.sg/licence-directory/lta/private-hire-car-drivers-vocational-licence-pdvl",
  },
  { id: "bbdc", href: "https://info.bbdc.sg/" },
  {
    id: "bbdcForeign",
    href: "https://info.bbdc.sg/course/foreign-licence-conversion/",
  },
  { id: "cdc", href: "https://www.cdc.com.sg/" },
  {
    id: "cdcForeign",
    href: "https://www.cdc.com.sg/course/foreign-licence-conversion/",
  },
  { id: "ssdc", href: "https://ssdcl.com.sg/" },
] as const;

/** Google Maps deep links for centres and Traffic Police HQ. */
export const CENTRE_MAPS = [
  {
    id: "bbdc",
    href: "https://www.google.com/maps/search/?api=1&query=Bukit+Batok+Driving+Centre+Singapore",
  },
  {
    id: "cdc",
    href: "https://www.google.com/maps/search/?api=1&query=ComfortDelGro+Driving+Centre+Ubi+Singapore",
  },
  {
    id: "ssdc",
    href: "https://www.google.com/maps/search/?api=1&query=Singapore+Safety+Driving+Centre+Ang+Mo+Kio",
  },
  {
    id: "tpHq",
    href: "https://www.google.com/maps/search/?api=1&query=Traffic+Police+Headquarters+10+Ubi+Avenue+3+Singapore",
  },
] as const;
