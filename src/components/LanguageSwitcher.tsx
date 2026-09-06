"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, LOCALE_LABELS, FULLY_TRANSLATED, type AppLocale } from "@/i18n/routing";

/**
 * Language menu.
 *
 * Two buttons worked for two languages; six needs a menu. Each language is
 * named in its own script, because someone looking for their language cannot
 * necessarily read the English name of it.
 *
 * Languages we have not fully translated are marked. The interface falls back
 * to English for anything untranslated, and saying so up front is better than
 * letting someone switch and quietly find half a page in a language they
 * cannot read.
 */
export default function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
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

  const current = LOCALE_LABELS[locale] ?? LOCALE_LABELS.en;

  const switchTo = (next: AppLocale) => {
    setIsOpen(false);
    router.replace(pathname, { locale: next });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-1.5 text-xs font-semibold text-ink transition hover:border-brand sm:px-2.5"
      >
        <span aria-hidden="true">{current.flag}</span>
        {/* The language name is worth the width on a wide screen, but on a
            phone it squeezes the product name out of the header entirely. */}
        <span className="hidden max-w-[5rem] truncate sm:inline">{current.native}</span>
      </button>

      {isOpen ? (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg"
        >
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
                  onClick={() => switchTo(code)}
                  className={[
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition",
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
      ) : null}
    </div>
  );
}
