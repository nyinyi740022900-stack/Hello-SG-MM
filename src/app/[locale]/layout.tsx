import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getMessages, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CountrySwitcher from "@/components/CountrySwitcher";
import { getSelectedCountryCode } from "@/lib/country.server";
import AppNav from "@/components/AppNav";
import AuthStatus from "@/components/AuthStatus";
import CookieNoticeBanner from "@/components/CookieNoticeBanner";
import { AuthProvider } from "@/context/AuthContext";
import { routing, type AppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";

/**
 * The message namespaces that client components actually read.
 *
 * `NextIntlClientProvider` serialises whatever it is given into the HTML of
 * every page. Handing it the whole catalogue meant shipping around 29KB of
 * translations to the browser on each request — 31KB in Myanmar, the largest
 * file — when most of those namespaces are only ever read by server
 * components, which do not need them on the client at all.
 *
 * This list is derived from every `useTranslations("…")` call in a file
 * marked "use client". **A client component reading a namespace missing from
 * this list will throw at runtime**, so add to it in the same commit that adds
 * the component.
 */
const CLIENT_NAMESPACES = [
  "ads",
  "auth",
  "common",
  "country",
  "expiryReminder",
  "formDownloads",
  "home",
  "legal",
  "menu",
  "news",
  "recruitmentFee",
  "salaryLog",
  "search",
  "translation",
  "wizard",
] as const;

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const allMessages = await getMessages();
  const messages = Object.fromEntries(
    CLIENT_NAMESPACES.filter((ns) => ns in allMessages).map((ns) => [ns, allMessages[ns]]),
  );
  const tCommon = await getTranslations("common");
  const tLegal = await getTranslations("legal");
  const resolvedLocale = locale as AppLocale;
  const selectedCountry = await getSelectedCountryCode();

  return (
    <NextIntlClientProvider messages={messages}>
      <AuthProvider>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 pb-6 pt-4 sm:px-6 sm:pt-6">
          <header className="sticky top-0 z-30 -mx-4 border-b border-border bg-surface px-4 py-3 sm:static sm:mx-0 sm:rounded-2xl sm:border sm:p-5 sm:shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <Link href="/" locale={resolvedLocale} className="min-w-0">
                  <h1 className="truncate text-lg font-bold tracking-tight text-ink sm:text-xl">
                    {tCommon("appName")}
                  </h1>
                  <p className="hidden text-xs text-ink-subtle sm:block">
                    {tCommon("tagline")}
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                  <CountrySwitcher selected={selectedCountry} />
                  <LanguageSwitcher />
                  <AuthStatus locale={resolvedLocale} />
                  <AppNav locale={resolvedLocale} />
                </div>
              </div>
            </div>
          </header>
          {children}
        </main>

        <footer className="mx-auto w-full max-w-6xl px-4 pb-6 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-ink-subtle">
            <span>{tLegal("footerCopyright", { year: new Date().getFullYear() })}</span>
            <Link
              href="/privacy"
              className="hover:text-ink hover:underline"
            >
              {tLegal("privacyPolicy")}
            </Link>
            <Link
              href="/terms"
              className="hover:text-ink hover:underline"
            >
              {tLegal("termsOfService")}
            </Link>
            <Link
              href="/help"
              className="hover:text-ink hover:underline"
            >
              {tCommon("help")}
            </Link>
            <Link
              href="/cookies"
              className="hover:text-ink hover:underline"
            >
              {tLegal("cookies")}
            </Link>
            <Link
              href="/contact"
              className="hover:text-ink hover:underline"
            >
              {tLegal("contact")}
            </Link>
          </div>
        </footer>
        <CookieNoticeBanner locale={resolvedLocale} />
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
