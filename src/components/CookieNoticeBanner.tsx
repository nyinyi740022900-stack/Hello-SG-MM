"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

type CookieNoticeBannerProps = {
  locale: AppLocale;
};

const STORAGE_KEY = "cookie_notice_acknowledged_v1";

export default function CookieNoticeBanner({ locale }: CookieNoticeBannerProps) {
  const t = useTranslations("legal");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const acknowledged = window.localStorage.getItem(STORAGE_KEY);
    queueMicrotask(() => {
      setVisible(!acknowledged);
    });
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 rounded-xl border border-border bg-surface p-3 shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-md">
      <p className="text-xs text-ink-muted">
        {t("cookieNoticeText")}
        <Link href="/cookies" locale={locale} className="ml-1 font-medium text-brand underline">
          {t("cookieNoticeLearnMore")}
        </Link>
      </p>
      <button
        type="button"
        className="mt-2 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-ink-on-brand hover:bg-brand-strong"
        onClick={() => {
          window.localStorage.setItem(STORAGE_KEY, "1");
          setVisible(false);
        }}
      >
        {t("cookieNoticeAccept")}
      </button>
    </div>
  );
}
