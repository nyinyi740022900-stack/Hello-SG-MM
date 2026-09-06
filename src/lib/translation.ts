import type { ContentCategory, ContentItem } from "@/lib/content";
import type { AppLocale } from "@/i18n/routing";
import { FULLY_TRANSLATED } from "@/i18n/routing";

/**
 * What may be machine translated, and what may not.
 *
 * Machine translation here is not a quality question, it is a safety one. The
 * dangerous failure is fluent and confident: a dropped negation turns "do not
 * pay an agent fee" into instruction to pay one, and it reads perfectly well
 * in the target language. English and Myanmar get read by people who would
 * catch that. The other four currently do not.
 *
 * So the line is drawn by consequence, not by topic interest: if acting on a
 * wrong version of an item could cost someone money, their job, their pass or
 * their safety, it is not machine translated. Those items stay in English,
 * clearly, rather than appearing in a reader's language with invisible risk
 * baked in.
 */
export const TRANSLATABLE_CATEGORIES: ContentCategory[] = [
  "community",
  "education",
  "transport",
];

/**
 * Categories held back from machine translation until a speaker has reviewed
 * them: work-pass rules, consular procedure, scams, legal process, money and
 * jobs — the four where being wrong is expensive — plus health.
 */
export function isTranslatableCategory(category: ContentCategory): boolean {
  return TRANSLATABLE_CATEGORIES.includes(category);
}

export type TranslatedFields = {
  title: string;
  summary: string | null;
  body: string;
  /** True when this text came from machine translation and must be labelled. */
  isMachineTranslated: boolean;
  /** The language the reader is actually being shown. */
  shownLocale: AppLocale;
};

type StoredTranslation = {
  title?: unknown;
  summary?: unknown;
  body?: unknown;
};

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/**
 * Choose which language of an item to show, and say whether it needs a label.
 *
 * Order: the reader's own language if we have a human-written version, then a
 * machine translation when the category allows one, then English.
 */
export function resolveTranslation(
  item: ContentItem,
  locale: AppLocale,
): TranslatedFields {
  if (locale === "my") {
    return {
      title: item.title_my,
      summary: item.summary_my,
      body: item.body_my,
      isMachineTranslated: false,
      shownLocale: "my",
    };
  }

  if (locale !== "en" && isTranslatableCategory(item.category)) {
    const store = (item.translations ?? {}) as Record<string, StoredTranslation>;
    const candidate = store[locale];
    const title = asText(candidate?.title);
    const body = asText(candidate?.body);

    // Both title and body must exist. A translated headline over an English
    // body is worse than plain English — it implies the whole item was
    // translated and the reader simply cannot read the rest.
    if (title && body) {
      return {
        title,
        summary: asText(candidate?.summary),
        body,
        isMachineTranslated: true,
        shownLocale: locale,
      };
    }
  }

  return {
    title: item.title_en,
    summary: item.summary_en,
    body: item.body_en,
    isMachineTranslated: false,
    shownLocale: "en",
  };
}

/** True when the reader's interface language is only partly translated. */
export function isPartiallyTranslatedLocale(locale: AppLocale): boolean {
  return !FULLY_TRANSLATED.includes(locale);
}
