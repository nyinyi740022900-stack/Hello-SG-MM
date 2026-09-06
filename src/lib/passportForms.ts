import type { WorkerType } from "@/lib/formDrafts";

/**
 * Official Myanmar Embassy Singapore passport renewal forms, served as
 * static files so applicants can download and print them directly —
 * no auto-fill, just the blank form to complete by hand and sign.
 */
export const PASSPORT_FORM_DOWNLOAD_PATHS: Record<WorkerType, string> = {
  general: "/forms/RenewPassport-V1.pdf",
  maid: "/forms/RenewPassport-V2.pdf",
};
