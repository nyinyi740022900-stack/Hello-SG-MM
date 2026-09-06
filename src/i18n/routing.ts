import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "my", "zh", "ta", "bn", "ms"],
  defaultLocale: "en",
});

export type AppLocale = (typeof routing.locales)[number];

/**
 * Languages offered in the switcher.
 *
 * Chosen for who actually lives and works in Singapore: Myanmar, Mandarin,
 * Tamil and Malay (three of them Singapore's own official languages) and
 * Bengali for the large Bangladeshi workforce.
 *
 * Each label is written in its own language — someone looking for their
 * language cannot read the name of it in English.
 */
export const LOCALE_LABELS: Record<AppLocale, { native: string; flag: string }> = {
  en: { native: "English", flag: "🇬🇧" },
  my: { native: "မြန်မာ", flag: "🇲🇲" },
  zh: { native: "中文", flag: "🇨🇳" },
  ta: { native: "தமிழ்", flag: "🇮🇳" },
  bn: { native: "বাংলা", flag: "🇧🇩" },
  ms: { native: "Melayu", flag: "🇲🇾" },
};

/** Locales we ship a full interface for. The rest fall back to English. */
export const FULLY_TRANSLATED: AppLocale[] = ["en", "my"];
