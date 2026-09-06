import { supabase } from "@/lib/supabase";

export const PASSPORT_FORM_TYPE = "passport_renewal";

/**
 * Field set mirrors the two real Myanmar Embassy Singapore passport renewal
 * forms (Personal History Form + Tax Application Form), sourced from
 * myanmarembassy.sg/downloads/consular/RenewPassport-V1.pdf (general worker)
 * and RenewPassport-V2.pdf (domestic worker / maid — adds Maid Agency fields).
 * These are static print-and-fill forms, not digital AcroForms, so the PDF
 * we export is a filled replica the applicant prints and brings in person.
 */
export type WorkerType = "general" | "maid";

export type PassportDraftData = {
  workerType: WorkerType;

  // Personal History Form
  fullName: string;
  nrcNumber: string;
  fatherName: string;
  motherName: string;
  spouseName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  occupation: string;
  salary: string;
  employerCompany: string;
  stayType: string;
  finNumber: string;
  heightFeet: string;
  heightInches: string;
  eyeColor: string;
  specialPeculiarities: string;
  raceReligion: string;
  currentPassportNumber: string;
  currentPassportIssuedDate: string;
  currentPassportIssuedPlace: string;
  addressMyanmar: string;
  phoneSingapore: string;
  emailSingapore: string;

  // Maid variant only (V2)
  maidAgencySingapore: string;
  maidAgencyMyanmar: string;

  // Tax Application Form (extra fields not already covered above)
  gender: string;
  addressSingapore: string;
};

export const EMPTY_PASSPORT_DRAFT: PassportDraftData = {
  workerType: "maid",
  fullName: "",
  nrcNumber: "",
  fatherName: "",
  motherName: "",
  spouseName: "",
  dateOfBirth: "",
  placeOfBirth: "",
  occupation: "",
  salary: "",
  employerCompany: "",
  stayType: "",
  finNumber: "",
  heightFeet: "",
  heightInches: "",
  eyeColor: "",
  specialPeculiarities: "",
  raceReligion: "",
  currentPassportNumber: "",
  currentPassportIssuedDate: "",
  currentPassportIssuedPlace: "",
  addressMyanmar: "",
  phoneSingapore: "",
  emailSingapore: "",
  maidAgencySingapore: "",
  maidAgencyMyanmar: "",
  gender: "",
  addressSingapore: "",
};

type FormDraftRow = {
  draft_data: Partial<PassportDraftData> | null;
};

export async function loadPassportDraft(userId: string) {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("form_drafts")
    .select("draft_data")
    .eq("user_id", userId)
    .eq("form_type", PASSPORT_FORM_TYPE)
    .maybeSingle<FormDraftRow>();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data?.draft_data) {
    return { data: null, error: null };
  }

  return { data: { ...EMPTY_PASSPORT_DRAFT, ...data.draft_data }, error: null };
}

export async function savePassportDraft(userId: string, draftData: PassportDraftData) {
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase.from("form_drafts").upsert(
    {
      user_id: userId,
      form_type: PASSPORT_FORM_TYPE,
      draft_data: draftData,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,form_type",
      ignoreDuplicates: false,
    },
  );

  return { error: error?.message ?? null };
}
