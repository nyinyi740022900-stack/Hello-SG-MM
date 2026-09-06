import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

type Messages = Record<string, unknown>;

/**
 * Fill any key a locale has not translated yet from English.
 *
 * Without this, adding a language means translating all 400-odd keys before it
 * can be switched on at all. With it, a partial translation is shippable: the
 * translated parts appear, and the rest stays readable English instead of
 * throwing or rendering a raw key name at someone.
 */
function mergeMessages(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const existing = out[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      existing &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      out[key] = mergeMessages(existing as Messages, value as Messages);
    } else if (typeof value === "string" && value.trim() === "") {
      // An empty string means "not translated yet" — keep the English.
      continue;
    } else {
      out[key] = value;
    }
  }

  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const english = (await import("../messages/en.json")).default as Messages;

  if (locale === "en") {
    return { locale, messages: english };
  }

  const localeMessages = (await import(`../messages/${locale}.json`))
    .default as Messages;

  return { locale, messages: mergeMessages(english, localeMessages) };
});
