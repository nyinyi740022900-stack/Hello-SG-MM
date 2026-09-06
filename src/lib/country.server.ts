import { cookies } from "next/headers";
import {
  COUNTRY_COOKIE,
  DEFAULT_COUNTRY,
  getCountry,
  isCountryCode,
  type Country,
  type CountryCode,
} from "@/lib/countries";

/**
 * The reader's home country, as chosen in the header.
 *
 * Returns null when they have not chosen. Null is not the same as "Myanmar":
 * pages use it to offer the choice rather than silently assuming one, so a
 * Bangladeshi reader is never shown Myanmar embassy details as if they were
 * theirs. Only call `resolveSelectedCountry` where a concrete country is
 * genuinely required.
 */
export async function getSelectedCountryCode(): Promise<CountryCode | null> {
  const store = await cookies();
  const value = store.get(COUNTRY_COOKIE)?.value;
  return isCountryCode(value) ? value : null;
}

export async function getSelectedCountry(): Promise<Country | null> {
  const code = await getSelectedCountryCode();
  return code ? getCountry(code) : null;
}

/** The chosen country, falling back to the default where one must be shown. */
export async function resolveSelectedCountry(): Promise<Country> {
  return (await getSelectedCountry()) ?? getCountry(DEFAULT_COUNTRY);
}
