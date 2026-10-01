import type { Metadata, Viewport } from "next";
import { getLocale } from "next-intl/server";
import { Geist, Geist_Mono, Noto_Sans_Myanmar } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import type { ReactNode } from "react";
import "./globals.css";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const myanmarFont = Noto_Sans_Myanmar({
  variable: "--font-myanmar",
  subsets: ["myanmar"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Hello SG MM",
    template: "%s · Hello SG MM",
  },
  description:
    "Bilingual (English/Myanmar) news and everyday help for life in Singapore",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hello SG MM",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef2f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f16" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  // Every page previously declared lang="en", including the Myanmar ones. That
  // told browsers' built-in translation the wrong source language, made screen
  // readers pronounce Myanmar text with an English voice, and had search
  // engines index the wrong language. Declaring the real locale is also what
  // makes browser translation work for readers whose language we do not ship.
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${myanmarFont.variable} h-full antialiased`}
    >
      <head>
        {/* Airalo/Impact.com affiliate program: site-ownership verification. */}
        <meta
          name="impact-site-verification"
          content="191be97f-1153-4236-a8aa-b786fe2e929f"
          {...({ value: "191be97f-1153-4236-a8aa-b786fe2e929f" } as Record<string, string>)}
        />
        {ADSENSE_CLIENT_ID ? (
          // AdSense's own site-ownership crawler reads the raw HTML
          // response and doesn't execute JS, so it never sees the
          // next/script-injected loader below (confirmed: "beforeInteractive"
          // still renders as a preload + inline bootstrap array in the
          // server HTML, not a literal <script src> tag, and verification
          // failed against it). A plain <meta> tag, like the existing
          // Impact.com one, is unambiguously present in the raw response.
          <meta name="google-adsense-account" content={ADSENSE_CLIENT_ID} />
        ) : null}
        {ADSENSE_CLIENT_ID ? (
          // Loaded site-wide, once, independent of whether any ad unit
          // (GoogleAdSlot) has a slot id configured yet — Google's site
          // verification and ads.txt authorization both need this present
          // on every page before a single ad unit can go live.
          //
          // strategy="beforeInteractive" (not the default afterInteractive)
          // because Google's site-ownership crawler reads the raw HTML
          // response, not client-rendered DOM — afterInteractive injects the
          // tag only after hydration in the browser, which is invisible to a
          // crawler that doesn't execute JS. beforeInteractive is the one
          // strategy Next.js actually inlines into the server-rendered HTML.
          <Script
            id="google-adsense-loader"
            strategy="beforeInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        {/* Cookieless page-view tracking (Vercel Web Analytics) — the
            cookie-consent banner already tells readers "we use analytics
            cookies", but until now nothing actually tracked visits at all,
            not even the ad-impression-only numbers the admin dashboard
            showed. This closes that gap without needing a consent-banner
            change, since it sets no cookies. */}
        <Analytics />
      </body>
    </html>
  );
}
