"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CONTENT_CATEGORIES, type ContentCategory } from "@/lib/content";
import type { AppLocale } from "@/i18n/routing";

/**
 * Topic tabs for the home feed.
 *
 * These filter the feed in place rather than navigating to a separate page —
 * tapping a topic should narrow what is already in front of you, and only
 * tapping a headline should take you somewhere new.
 *
 * Client-side purely to keep the selected tab visible: the strip scrolls, and
 * a server render resets that scroll to the start, which hides the active tab
 * whenever it sits past the fold. With ten topics that is most of them.
 */
export default function CategoryTabs({
  locale,
  activeCategory,
}: {
  locale: AppLocale;
  activeCategory?: ContentCategory;
}) {
  const t = useTranslations("news");
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLAnchorElement | null>(null);
  const [topOffset, setTopOffset] = useState(57);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const active = activeRef.current;
    if (!scroller || !active) return;

    // Centre the active tab without scrolling the page itself, which
    // scrollIntoView would otherwise do on a sticky element.
    const target =
      active.offsetLeft - scroller.clientWidth / 2 + active.clientWidth / 2;
    scroller.scrollTo({ left: Math.max(0, target), behavior: "auto" });
  }, [activeCategory]);

  // The hardcoded 57px this used to assume was only ever right for one exact
  // header layout — it drifted the moment the header's own content changed
  // height (wrapping language label, logo swap, safe-area inset on notched
  // phones), leaving a gap or an overlap between header and tabs. Measuring
  // the real header keeps this correct regardless of what the header does.
  useEffect(() => {
    const header = document.getElementById("site-header");
    if (!header) return;

    const measure = () => setTopOffset(header.getBoundingClientRect().height);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(header);
    window.addEventListener("resize", measure);
    // ResizeObserver doesn't always fire on initial web-font swap / image
    // load inside the header, so a one-shot delayed re-measure catches that.
    const timer = setTimeout(measure, 400);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      clearTimeout(timer);
    };
  }, []);

  const chip = (isActive: boolean) =>
    [
      "shrink-0 rounded-full px-3 py-1.5 text-xs transition",
      isActive
        ? "bg-brand font-semibold text-ink-on-brand"
        : "font-medium text-ink-muted hover:bg-brand-soft hover:text-brand-strong",
    ].join(" ");

  return (
    <div
      className="sticky z-20 border-b border-border bg-surface sm:static"
      style={{ top: `${topOffset}px` }}
    >
      <div ref={scrollerRef} className="overflow-x-auto">
        <div className="flex gap-1 px-3 py-2">
          <Link
            href="/"
            locale={locale}
            scroll={false}
            ref={activeCategory ? undefined : activeRef}
            aria-current={activeCategory ? undefined : "true"}
            className={chip(!activeCategory)}
          >
            {t("allCategories")}
          </Link>

          {CONTENT_CATEGORIES.map((category) => {
            const isActive = activeCategory === category;
            return (
              <Link
                key={category}
                href={`/?category=${category}`}
                locale={locale}
                scroll={false}
                ref={isActive ? activeRef : undefined}
                aria-current={isActive ? "true" : undefined}
                className={chip(isActive)}
              >
                {t(`category.${category}`)}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
