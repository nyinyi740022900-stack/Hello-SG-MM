"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { COUNTRIES, COUNTRY_COOKIE, type CountryCode } from "@/lib/countries";
import { routing, LOCALE_LABELS, FULLY_TRANSLATED, type AppLocale } from "@/i18n/routing";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Language and home-country, combined into one control.
 *
 * These used to be two separate flag pills. On a phone, with the locale set
 * to Myanmar and the home country also Myanmar, both pills showed the
 * identical flag side by side — nothing distinguished "what you read" from
 * "whose embassy is yours," so the second pill just looked like a broken
 * duplicate of the first. A single button with a neutral icon, opening one
 * panel with the two choices clearly labelled, removes the ambiguity instead
 * of trying to make two lookalike pills tell themselves apart.
 *
 * The two choices stay logically separate underneath (a locale-prefixed
 * route change for language, a plain cookie + refresh for country) for the
 * same reason the original components kept them apart: plenty of readers
 * pair them differently, e.g. Tamil-reading Indian nationals.
 */
export default function RegionLanguageSwitcher({
  selectedCountry,
}: {
  selectedCountry: CountryCode | null;
}) {
  const t = useTranslations("country");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const currentCountry = COUNTRIES.find((c) => c.code === selectedCountry) ?? null;
  const currentLocaleMeta = LOCALE_LABELS[locale] ?? LOCALE_LABELS.en;

  const chooseCountry = (code: CountryCode) => {
    document.cookie = `${COUNTRY_COOKIE}=${code}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
    startTransition(() => router.refresh());
  };

  const chooseLanguage = (code: AppLocale) => {
    setIsOpen(false);
    router.replace(pathname, { locale: code });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={t("switcherButtonLabel")}
        aria-busy={isPending}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-1.5 text-xs font-semibold text-ink transition hover:border-brand sm:px-2.5"
      >
        {isPending ? (
          <span
            aria-hidden="true"
            className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
          />
        ) : (
          <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        )}
        <span aria-hidden="true">{currentLocaleMeta.flag}</span>
        <span className="hidden max-w-[6rem] truncate sm:inline">
          {currentLocaleMeta.native}
          {currentCountry ? ` · ${currentCountry.flag}` : ""}
        </span>
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-label={t("switcherButtonLabel")}
          // A 256px anchored dropdown reliably overflows the left edge on a
          // phone, since this button rarely sits at the header's true right
          // edge (auth/menu controls sit further right of it). Below `sm`,
          // anchor to the viewport instead of the button.
          className="fixed inset-x-3 top-16 z-50 space-y-3 overflow-hidden rounded-xl border border-border bg-surface p-2 shadow-lg sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-1 sm:w-64"
        >
          <div>
            <p className="px-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
              {t("sectionLanguage")}
            </p>
            <ul role="listbox" aria-label={t("sectionLanguage")} className="max-h-48 overflow-y-auto">
              {routing.locales.map((code) => {
                const meta = LOCALE_LABELS[code];
                const isCurrent = code === locale;
                const partial = !FULLY_TRANSLATED.includes(code);
                return (
                  <li key={code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isCurrent}
                      onClick={() => chooseLanguage(code)}
                      className={[
                        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition",
                        isCurrent
                          ? "bg-brand-soft font-semibold text-brand-strong"
                          : "text-ink hover:bg-surface-muted",
                      ].join(" ")}
                    >
                      <span aria-hidden="true">{meta.flag}</span>
                      <span className="flex-1 truncate">{meta.native}</span>
                      {partial ? (
                        <span className="shrink-0 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-ink-subtle">
                          beta
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border-t border-border pt-2">
            <p className="px-1.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
              {t("switcherLabel")}
            </p>
            <ul role="listbox" aria-label={t("switcherLabel")} className="max-h-48 overflow-y-auto">
              {COUNTRIES.map((country) => {
                const isCurrent = country.code === selectedCountry;
                return (
                  <li key={country.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isCurrent}
                      onClick={() => chooseCountry(country.code)}
                      className={[
                        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition",
                        isCurrent
                          ? "bg-brand-soft font-semibold text-brand-strong"
                          : "text-ink hover:bg-surface-muted",
                      ].join(" ")}
                    >
                      <span aria-hidden="true">{country.flag}</span>
                      <span className="flex-1 truncate">{country.nativeName}</span>
                      <span className="shrink-0 text-[11px] text-ink-subtle">
                        {country.currency}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full rounded-lg bg-surface-muted py-1.5 text-xs font-semibold text-ink-muted hover:text-ink"
          >
            {t("done")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
