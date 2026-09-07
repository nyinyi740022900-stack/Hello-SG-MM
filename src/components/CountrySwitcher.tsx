"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { COUNTRIES, COUNTRY_COOKIE, type CountryCode } from "@/lib/countries";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Home-country menu, sitting beside the language menu in the header.
 *
 * Separate from language on purpose: the two answer different questions.
 * Language is what you read; home country is whose embassy renews your
 * passport and which currency your remittance lands in. Plenty of readers
 * pair them differently — Tamil-reading Indian nationals, Myanmar workers who
 * read English — and folding one into the other would get both wrong.
 *
 * The choice is a plain cookie rather than a stored profile field so it works
 * before anyone signs in, which is when most people first need it. It is a
 * display preference with nothing sensitive in it, so a JS-readable cookie is
 * the right weight; `router.refresh()` then re-renders the server components
 * that depend on it.
 */
export default function CountrySwitcher({
  selected,
}: {
  selected: CountryCode | null;
}) {
  const t = useTranslations("country");
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

  const current = COUNTRIES.find((c) => c.code === selected) ?? null;

  const choose = (code: CountryCode) => {
    setIsOpen(false);
    document.cookie = `${COUNTRY_COOKIE}=${code}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t("switcherLabel")}
        aria-busy={isPending}
        disabled={isPending}
        className={[
          "inline-flex items-center gap-1.5 rounded-full border bg-surface px-2 py-1.5 text-xs font-semibold text-ink transition hover:border-brand disabled:opacity-60 sm:px-2.5",
          // Unchosen, the control is the one thing on the page a new reader
          // needs to touch, so it gets the brand outline to pull the eye. Once
          // chosen it settles back into the header furniture.
          current ? "border-border" : "border-brand text-brand-strong",
        ].join(" ")}
      >
        {/* The refresh is a server round trip and takes a few seconds on a
            phone. Without a visible change the control looks broken and people
            tap again, so the flag becomes a spinner while it is in flight. */}
        {isPending ? (
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
          />
        ) : (
          <span aria-hidden="true">{current ? current.flag : "🌐"}</span>
        )}
        {/* The label earns its width on a wide screen; on a phone it pushes
            the product name out of the header, so only the flag survives. */}
        <span className="hidden max-w-[5rem] truncate sm:inline">
          {current ? current.nativeName : t("choosePrompt")}
        </span>
      </button>

      {isOpen ? (
        <ul
          role="listbox"
          aria-label={t("switcherLabel")}
          className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg"
        >
          <li className="px-3 py-1.5 text-[11px] font-medium text-ink-subtle">
            {t("menuHint")}
          </li>
          {COUNTRIES.map((country) => {
            const isCurrent = country.code === selected;
            return (
              <li key={country.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isCurrent}
                  onClick={() => choose(country.code)}
                  className={[
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition",
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
      ) : null}
    </div>
  );
}
