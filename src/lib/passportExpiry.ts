/**
 * Myanmar machine-readable passports (MRP) issued via the Myanmar Embassy
 * Singapore are valid for 5 years from the date of issue (see
 * myanmarembassy.sg guidelines, "New Passport Collection" section).
 */
export const MRP_VALIDITY_YEARS = 5;

export type ExpiryStatus = "ok" | "warning" | "urgent" | "expired" | "unknown";

export type PassportExpiryInfo = {
  expiryDate: string; // ISO date
  daysRemaining: number;
  status: ExpiryStatus;
};

/**
 * Estimate a passport's expiry date and urgency from its issue date.
 * Pure function — no I/O, easy to unit test.
 */
export function calculatePassportExpiry(
  issuedDateIso: string,
  now: Date = new Date(),
): PassportExpiryInfo | null {
  if (!issuedDateIso) return null;

  const issuedDate = new Date(issuedDateIso);
  if (Number.isNaN(issuedDate.getTime())) return null;

  const expiry = new Date(issuedDate);
  expiry.setFullYear(expiry.getFullYear() + MRP_VALIDITY_YEARS);

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / msPerDay);

  let status: ExpiryStatus;
  if (daysRemaining < 0) status = "expired";
  else if (daysRemaining <= 90) status = "urgent";
  else if (daysRemaining <= 180) status = "warning";
  else status = "ok";

  return {
    expiryDate: expiry.toISOString().slice(0, 10),
    daysRemaining,
    status,
  };
}
