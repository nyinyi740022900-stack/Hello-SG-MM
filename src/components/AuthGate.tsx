"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import type { ReactNode } from "react";
import type { AppLocale } from "@/i18n/routing";
import StatusMessage from "@/components/ui/StatusMessage";

type AuthGateProps = {
  locale: AppLocale;
  children: ReactNode;
};

export default function AuthGate({ locale, children }: AuthGateProps) {
  const { user, isLoading, isConfigured } = useAuth();
  const pathname = usePathname();
  const t = useTranslations("auth");

  if (isLoading) {
    return <StatusMessage variant="loading">{t("checkingSession")}</StatusMessage>;
  }

  if (!isConfigured) {
    return (
      <StatusMessage variant="error">
        Supabase is not configured. Add values to <code>.env.local</code> before
        using auth features.
      </StatusMessage>
    );
  }

  if (!user) {
    return (
      <StatusMessage variant="warning">
        <span className="block">
          <span className="font-medium">{t("gateTitle")}</span>
          <span className="mt-1 block">{t("gateBody")}</span>
          <span className="mt-3 flex gap-4">
            <Link
              href={{ pathname: "/login", query: { next: pathname } }}
              locale={locale}
              className="font-semibold underline"
            >
              {t("loginTitle")}
            </Link>
            <Link
              href={{ pathname: "/register", query: { next: pathname } }}
              locale={locale}
              className="font-semibold underline"
            >
              {t("registerTitle")}
            </Link>
          </span>
        </span>
      </StatusMessage>
    );
  }

  return <>{children}</>;
}
