/**
 * Home countries the portal serves.
 *
 * The app began as a Myanmar-worker service and is now for anyone living in
 * Singapore, but plenty of what it does is only meaningful relative to where
 * someone is from: which embassy renews your passport, which currency your
 * remittance lands in, which consular notice matters to you.
 *
 * A reader's home country is therefore a separate axis from their reading
 * language. A Bangladeshi worker may read English; a Myanmar worker in
 * Singapore may prefer Chinese. Tying country to locale would get both wrong.
 */

export type CountryCode = "mm" | "in" | "cn" | "bd" | "my";

/**
 * A country's diplomatic mission in Singapore.
 *
 * Deliberately thin. Fees, opening hours, appointment rules and document lists
 * change without notice and differ by service, and a stale copy of them here
 * would send someone across the island for nothing. So we carry only what is
 * stable — who the mission is, where it is, how to reach it — and send the
 * reader to the mission's own page for anything that moves.
 *
 * `address` and `phone` are present only where they were confirmed against the
 * mission's own site or its listing; both render conditionally rather than
 * being guessed at.
 */
export type Mission = {
  /** "Embassy" or "High Commission" — Commonwealth countries use the latter. */
  name: string;
  /** Mission homepage. */
  url: string;
  /** Deep link to passport/consular services, when the site has a stable one. */
  consularUrl: string;
  address: string | null;
  phone: string | null;
};

export type Country = {
  code: CountryCode;
  /** Written in the country's own language first, as the switcher shows it. */
  nativeName: string;
  englishName: string;
  flag: string;
  /** Currency a remittance home is converted into. */
  currency: string;
  currencyName: string;
  mission: Mission;
  /**
   * True when this app hosts the country's own blank passport forms and a
   * step-by-step checklist. Only Myanmar does today; every other country links
   * straight to its mission, which is honest about what we have actually
   * checked rather than implying equal coverage.
   */
  hasLocalPassportGuide: boolean;
};

export const COUNTRIES: Country[] = [
  {
    code: "mm",
    nativeName: "မြန်မာ",
    englishName: "Myanmar",
    flag: "🇲🇲",
    currency: "MMK",
    currencyName: "Kyat",
    mission: {
      name: "Embassy of the Republic of the Union of Myanmar",
      url: "http://www.myanmarembassy.sg/",
      consularUrl: "http://www.myanmarembassy.sg/consular.html",
      address: "15 St Martin's Drive, Singapore 257996",
      phone: "+65 6735 2035",
    },
    hasLocalPassportGuide: true,
  },
  {
    code: "in",
    nativeName: "भारत",
    englishName: "India",
    flag: "🇮🇳",
    currency: "INR",
    currencyName: "Rupee",
    mission: {
      name: "High Commission of India",
      url: "https://www.hcisingapore.gov.in/",
      consularUrl: "https://www.blsinternational.com/india/singapore/",
      address: "31 Grange Road, Singapore 239702",
      phone: null,
    },
    hasLocalPassportGuide: false,
  },
  {
    code: "cn",
    nativeName: "中国",
    englishName: "China",
    flag: "🇨🇳",
    currency: "CNY",
    currencyName: "Yuan",
    mission: {
      name: "Embassy of the People's Republic of China",
      url: "https://sg.china-embassy.gov.cn/eng/",
      consularUrl: "https://sg.china-embassy.gov.cn/eng/lsfwx/",
      address: "150 Tanglin Road, Singapore 247969",
      phone: "+65 6471 2117",
    },
    hasLocalPassportGuide: false,
  },
  {
    code: "bd",
    nativeName: "বাংলাদেশ",
    englishName: "Bangladesh",
    flag: "🇧🇩",
    currency: "BDT",
    currencyName: "Taka",
    mission: {
      name: "High Commission for the People's Republic of Bangladesh",
      url: "https://singapore.mofa.gov.bd/",
      consularUrl: "https://singapore.mofa.gov.bd/en/site/page/General-Information",
      address: "Jit Poh Building, 19 Keppel Road, #04-00 & #10-00, Singapore 089058",
      phone: "+65 6255 0075",
    },
    hasLocalPassportGuide: false,
  },
  {
    code: "my",
    nativeName: "Malaysia",
    englishName: "Malaysia",
    flag: "🇲🇾",
    currency: "MYR",
    currencyName: "Ringgit",
    mission: {
      name: "High Commission of Malaysia",
      url: "https://www.kln.gov.my/web/sgp_singapore/home",
      consularUrl: "https://www.kln.gov.my/web/sgp_singapore/passport_renewal",
      address: null,
      phone: "+65 6887 6256",
    },
    hasLocalPassportGuide: false,
  },
];

export const COUNTRY_CODES: CountryCode[] = COUNTRIES.map((c) => c.code);

export const DEFAULT_COUNTRY: CountryCode = "mm";

export function getCountry(code: string | undefined | null): Country {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === "string" && (COUNTRY_CODES as string[]).includes(value);
}

/**
 * Where the choice is kept.
 *
 * A cookie rather than localStorage because the server renders the rate strip
 * and the embassy panel: reading it on the client only would mean everyone
 * gets Myanmar on first paint and then a flicker to their own country.
 */
export const COUNTRY_COOKIE = "hellosg_country";
