"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import {
  ChecklistIcon,
  GuideIcon,
  HelpIcon,
  HomeIcon,
  PhoneAlertIcon,
  WizardIcon,
} from "@/components/icons";

type AppNavProps = {
  locale: AppLocale;
};

const ICONS = {
  home: HomeIcon,
  checklist: ChecklistIcon,
  guide: GuideIcon,
  contacts: PhoneAlertIcon,
  help: HelpIcon,
  wizard: WizardIcon,
} as const;

export default function AppNav({ locale }: AppNavProps) {
  const t = useTranslations("common");
  const pathname = usePathname();

  const links = useMemo(
    () => [
      { href: "/", key: "home" as const, label: t("home") },
      { href: "/passport/checklist", key: "checklist" as const, label: t("checklist") },
      { href: "/emergency-contacts", key: "contacts" as const, label: t("contacts") },
      { href: "/guide", key: "guide" as const, label: t("guide") },
      { href: "/help", key: "help" as const, label: t("help") },
    ],
    [t],
  );

  const isActive = (href: string) => {
    const routePath = href === "/" ? `/${locale}` : `/${locale}${href}`;
    return pathname === routePath || pathname.startsWith(`${routePath}/`);
  };

  return (
    <>
      {/* Desktop / tablet: horizontal tab bar */}
      <nav className="hidden w-full items-center gap-1 md:flex" aria-label={t("home")}>
        {links.map((link) => {
          const Icon = ICONS[link.key];
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              locale={locale}
              aria-current={active ? "page" : undefined}
              className={[
                "inline-flex h-11 items-center gap-2 rounded-xl px-3.5 text-sm font-medium transition",
                active
                  ? "bg-brand-soft text-brand-strong"
                  : "text-ink-muted hover:bg-surface-muted hover:text-ink",
              ].join(" ")}
            >
              <Icon className="h-4.5 w-4.5" />
              {link.label}
            </Link>
          );
        })}
        <Link
          href="/passport/wizard"
          locale={locale}
          className={[
            "ml-auto inline-flex h-11 items-center gap-2 rounded-xl border border-brand-soft-border px-4 text-sm font-semibold transition",
            isActive("/passport/wizard")
              ? "bg-brand text-ink-on-brand"
              : "bg-brand-soft text-brand-strong hover:bg-brand hover:text-ink-on-brand",
          ].join(" ")}
        >
          <WizardIcon className="h-4.5 w-4.5" />
          {t("wizard")}
        </Link>
      </nav>

      {/* Mobile: fixed bottom tab bar, app-style */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label={t("home")}
      >
        <div className="mx-auto flex max-w-6xl items-stretch justify-between px-1">
          {links.map((link) => {
            const Icon = ICONS[link.key];
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                locale={locale}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition",
                  active ? "text-brand-strong" : "text-ink-subtle",
                ].join(" ")}
              >
                <Icon className={`h-5.5 w-5.5 ${active ? "" : ""}`} />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
