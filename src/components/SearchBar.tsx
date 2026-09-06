"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { SearchIcon } from "@/components/icons";

/**
 * Feed search.
 *
 * A portal accumulates hundreds of items that scroll past in a day, and the
 * thing a reader usually wants ("that MOM levy notice from last week") is not
 * on screen. Categories narrow by topic; search is the only route to a
 * specific item once it has moved down the feed.
 */
export default function SearchBar({ locale }: { locale: AppLocale }) {
  const t = useTranslations("search");
  const router = useRouter();
  const [query, setQuery] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`, { locale });
  };

  return (
    <form onSubmit={submit} role="search" className="relative">
      <label htmlFor="site-search" className="sr-only">
        {t("placeholder")}
      </label>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-subtle" />
      <input
        id="site-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("placeholder")}
        className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-20 text-sm text-ink outline-none transition placeholder:text-ink-subtle focus:border-brand"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-lg bg-brand px-3 text-xs font-semibold text-ink-on-brand transition hover:bg-brand-strong"
      >
        {t("button")}
      </button>
    </form>
  );
}
