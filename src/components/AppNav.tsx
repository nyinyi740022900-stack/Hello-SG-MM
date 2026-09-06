"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";
import type { AppLocale } from "@/i18n/routing";
import { PASSPORT_FORM_DOWNLOAD_PATHS } from "@/lib/passportForms";
import {
  BankIcon,
  CalculatorIcon,
  CalendarCheckIcon,
  ChecklistIcon,
  CloseIcon,
  GuideIcon,
  HelpIcon,
  HomeIcon,
  MapPinIcon,
  MegaphoneIcon,
  MenuIcon,
  UserIcon,
  TransferIcon,
  WalletIcon,
  PhoneAlertIcon,
  ReceiptIcon,
  WizardIcon,
} from "@/components/icons";

type AppNavProps = {
  locale: AppLocale;
};

type NavLink = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
};

/**
 * Side drawer navigation.
 *
 * This replaced a five-slot bottom tab bar. As the portal grew past twenty
 * destinations, a fixed bar could only reach a quarter of them and the rest
 * were effectively unreachable; a grouped drawer shows everything at once,
 * which is why Yahoo uses the same pattern for a site of this shape.
 */
export default function AppNav({ locale }: AppNavProps) {
  const t = useTranslations("common");
  const tMenu = useTranslations("menu");
  const tHome = useTranslations("home");
  const tLegal = useTranslations("legal");
  const tForms = useTranslations("formDownloads");
  const pathname = usePathname();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => setIsOpen(false), []);

  // Close on navigation: the drawer must not stay open over the page you asked for.
  useEffect(() => {
    queueMicrotask(close);
  }, [pathname, close]);

  // Escape closes, and the page behind must not scroll while the drawer is over it.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    // Captured now: by cleanup time the ref may point elsewhere.
    const trigger = triggerRef.current;

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      // Send focus back where it came from, so keyboard users are not dropped
      // at the top of the document.
      trigger?.focus();
    };
  }, [isOpen, close]);

  const sections = useMemo<{ title: string; links: NavLink[] }[]>(
    () => [
      {
        title: tMenu("sectionMain"),
        links: [
          { href: "/", label: t("home"), icon: HomeIcon },
          { href: "/news", label: t("news"), icon: MegaphoneIcon },
          { href: "/events", label: t("events"), icon: CalendarCheckIcon },
          { href: "/directory", label: t("directory"), icon: MapPinIcon },
          { href: "/transport", label: t("transport"), icon: TransferIcon },
          { href: "/rates", label: t("rates"), icon: WalletIcon },
        ],
      },
      {
        title: tMenu("sectionPassport"),
        links: [
          { href: "/passport/wizard", label: t("wizard"), icon: WizardIcon },
          { href: "/passport/checklist", label: t("checklist"), icon: ChecklistIcon },
        ],
      },
      {
        title: tMenu("sectionTools"),
        links: [
          { href: "/salary-log", label: tHome("toolSalaryLog"), icon: ReceiptIcon },
          { href: "/recruitment-fee", label: tHome("toolRecruitmentFee"), icon: CalculatorIcon },
          { href: "/accounts-guide", label: tHome("quickAccountsGuide"), icon: BankIcon },
        ],
      },
      {
        title: tMenu("sectionRights"),
        links: [
          { href: "/rest-day-rights", label: tHome("toolRestDay"), icon: CalendarCheckIcon },
          { href: "/off-day-guide", label: tHome("toolOffDayGuide"), icon: MapPinIcon },
          { href: "/guide", label: t("guide"), icon: GuideIcon },
        ],
      },
      {
        title: tMenu("sectionHelp"),
        links: [
          { href: "/emergency-contacts", label: t("contacts"), icon: PhoneAlertIcon },
          { href: "/help", label: t("help"), icon: HelpIcon },
          { href: "/contact", label: t("contact"), icon: HelpIcon },
        ],
      },
      {
        // Sign-in is hidden from the header on phones to keep the product name
        // readable, so it has to be reachable here or it is reachable nowhere.
        title: tMenu("sectionAccount"),
        links: user
          ? [{ href: "/account", label: t("account"), icon: UserIcon }]
          : [
              { href: "/login", label: t("login"), icon: UserIcon },
              { href: "/register", label: t("register"), icon: UserIcon },
            ],
      },
    ],
    [t, tMenu, tHome, user],
  );

  const isActive = (href: string) => {
    const routePath = href === "/" ? `/${locale}` : `/${locale}${href}`;
    return href === "/" ? pathname === routePath : pathname.startsWith(routePath);
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
        <MenuIcon className="h-5 w-5" />
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
                <CloseIcon className="h-5 w-5" />
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
                        <li key={href}>
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
                            <Icon className="h-4.5 w-4.5 shrink-0" />
                            <span className="truncate">{label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              {/* Direct downloads, not routes — kept in the menu because this is
                  the thing people most often come back for. */}
              <div className="mb-3">
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                  {tForms("title")}
                </p>
                <ul>
                  <li>
                    <a
                      href={PASSPORT_FORM_DOWNLOAD_PATHS.general}
                      download
                      onClick={close}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink transition hover:bg-surface-muted"
                    >
                      <span className="w-4.5 shrink-0 text-center">📄</span>
                      <span className="truncate">{tForms("generalButton")}</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href={PASSPORT_FORM_DOWNLOAD_PATHS.maid}
                      download
                      onClick={close}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink transition hover:bg-surface-muted"
                    >
                      <span className="w-4.5 shrink-0 text-center">📄</span>
                      <span className="truncate">{tForms("maidButton")}</span>
                    </a>
                  </li>
                </ul>
              </div>

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
