"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const onSwitch = (nextLocale: AppLocale) => {
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-surface p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onSwitch("en")}
        aria-pressed={locale === "en"}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
          locale === "en"
            ? "bg-brand text-ink-on-brand"
            : "text-ink-muted hover:bg-surface-muted hover:text-ink"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onSwitch("my")}
        aria-pressed={locale === "my"}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
          locale === "my"
            ? "bg-brand text-ink-on-brand"
            : "text-ink-muted hover:bg-surface-muted hover:text-ink"
        }`}
      >
        မြန်မာ
      </button>
    </div>
  );
}
