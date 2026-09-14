"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BedDouble,
  BookOpen,
  Building2,
  Calculator,
  CalendarCheck,
  Car,
  CircleHelp,
  ClipboardPen,
  Dices,
  Home,
  Briefcase,
  Landmark,
  ListChecks,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  Phone,
  Plane,
  Radio,
  Receipt,
  User,
  Wallet,
  X,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";
import type { AppLocale } from "@/i18n/routing";

type AppNavProps = {
  locale: AppLocale;
};

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/**
 * Side drawer navigation.
 *
 * Grouped to match how people actually look for things: daily information,
 * money/travel tools, passport, rights, then help and account. Lottery lives
 * under Tools once (not duplicated under Information). Passport forms are
 * reached from the checklist page, so they are not repeated here.
 */
export default function AppNav({ locale }: AppNavProps) {
  const t = useTranslations("common");
  const tMenu = useTranslations("menu");
  const tHome = useTranslations("home");
  const tLegal = useTranslations("legal");
  const pathname = usePathname();
  const { user } = useAuth();
  const authNextQuery =
    pathname && pathname !== "/login" && pathname !== "/register"
      ? `?next=${encodeURIComponent(pathname)}`
      : "";

  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    queueMicrotask(close);
  }, [pathname, close]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const trigger = triggerRef.current;

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [isOpen, close]);

  const sections = useMemo<{ title: string; links: NavLink[] }[]>(
    () => [
      {
        title: tMenu("sectionMain"),
        links: [
          { href: "/", label: t("home"), icon: Home },
          { href: "/news", label: t("news"), icon: Megaphone },
          { href: "/events", label: t("events"), icon: CalendarCheck },
          { href: "/directory", label: t("directory"), icon: Building2 },
          { href: "/rates", label: t("rates"), icon: Wallet },
        ],
      },
      {
        title: tMenu("sectionTools"),
        links: [
          { href: "/transport", label: t("transport"), icon: ArrowLeftRight },
          { href: "/travel", label: t("travel"), icon: Plane },
          { href: "/housing", label: t("housing"), icon: BedDouble },
          { href: "/jobs", label: t("jobs"), icon: Briefcase },
          {
            href: "/driving-license",
            label: t("drivingLicense"),
            icon: Car,
          },
          { href: "/lottery", label: t("lottery"), icon: Dices },
          { href: "/radio", label: t("radio"), icon: Radio },
          { href: "/salary-log", label: tHome("toolSalaryLog"), icon: Receipt },
          {
            href: "/recruitment-fee",
            label: tHome("toolRecruitmentFee"),
            icon: Calculator,
          },
          {
            href: "/accounts-guide",
            label: tHome("quickAccountsGuide"),
            icon: Landmark,
          },
        ],
      },
      {
        title: tMenu("sectionPassport"),
        links: [
          { href: "/passport/wizard", label: t("wizard"), icon: ClipboardPen },
          {
            href: "/passport/checklist",
            label: t("checklist"),
            icon: ListChecks,
          },
        ],
      },
      {
        title: tMenu("sectionRights"),
        links: [
          {
            href: "/rest-day-rights",
            label: tHome("toolRestDay"),
            icon: CalendarCheck,
          },
          {
            href: "/off-day-guide",
            label: tHome("toolOffDayGuide"),
            icon: MapPin,
          },
          { href: "/guide", label: t("guide"), icon: BookOpen },
        ],
      },
      {
        title: tMenu("sectionHelp"),
        links: [
          {
            href: "/emergency-contacts",
            label: t("contacts"),
            icon: Phone,
          },
          { href: "/help", label: t("help"), icon: CircleHelp },
          { href: "/contact", label: t("contact"), icon: Mail },
        ],
      },
      {
        title: tMenu("sectionAccount"),
        links: user
          ? [{ href: "/account", label: t("account"), icon: User }]
          : [
              { href: `/login${authNextQuery}`, label: t("login"), icon: User },
              { href: `/register${authNextQuery}`, label: t("register"), icon: User },
            ],
      },
    ],
    [t, tMenu, tHome, user, authNextQuery],
  );

  const isActive = (href: string) => {
    const routePath = href === "/" ? `/${locale}` : `/${locale}${href}`;
    return href === "/"
      ? pathname === routePath
      : pathname.startsWith(routePath);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={tMenu("open")}
        aria-expanded={isOpen}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-ink transition hover:border-brand hover:text-brand"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label={tMenu("close")}
            onClick={close}
            className="absolute inset-0 bg-black/40"
          />

          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={tMenu("open")}
            tabIndex={-1}
            className="relative flex h-full w-[85%] max-w-sm flex-col overflow-y-auto bg-surface shadow-xl outline-none"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
              <span className="font-semibold text-ink">{tMenu("open")}</span>
              <button
                type="button"
                onClick={close}
                aria-label={tMenu("close")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-muted hover:text-ink"
              >
                <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 px-2 py-3">
              {sections.map((section) => (
                <div key={section.title} className="mb-3">
                  <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                    {section.title}
                  </p>
                  <ul>
                    {section.links.map(({ href, label, icon: Icon }) => {
                      const active = isActive(href);
                      return (
                        <li key={`${section.title}-${href}`}>
                          <Link
                            href={href}
                            locale={locale}
                            className={[
                              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                              active
                                ? "bg-brand-soft font-semibold text-brand-strong"
                                : "text-ink hover:bg-surface-muted",
                            ].join(" ")}
                          >
                            <Icon
                              className="h-5 w-5 shrink-0"
                              strokeWidth={1.75}
                              aria-hidden="true"
                            />
                            <span className="truncate">{label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              <div className="border-t border-border pt-3">
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                  {tMenu("sectionAbout")}
                </p>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-1 text-xs text-ink-muted">
                  <li>
                    <Link href="/privacy" locale={locale} className="hover:text-brand">
                      {tLegal("privacyPolicy")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" locale={locale} className="hover:text-brand">
                      {tLegal("termsOfService")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/cookies" locale={locale} className="hover:text-brand">
                      {tLegal("cookies")}
                    </Link>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
