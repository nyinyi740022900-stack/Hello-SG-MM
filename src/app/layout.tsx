import type { Metadata, Viewport } from "next";
import { getLocale } from "next-intl/server";
import { Geist, Geist_Mono, Noto_Sans_Myanmar } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

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
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
