import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/Card";

type CookiesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CookiesPage({ params }: CookiesPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const isMy = locale === "my";

  return (
    <section className="mx-auto w-full max-w-2xl space-y-5">
      <PageHeader
        title={isMy ? "Cookies မူဝါဒ" : "Cookies Policy"}
        subtitle={
          isMy
            ? "ဝဘ်ဆိုက်အလုပ်လုပ်ရန်လိုအပ်သော cookies နှင့် analytics/ad measurement cookies တို့ကို အသုံးပြုပါသည်။"
            : "We use essential cookies for authentication and optional analytics/ad measurement cookies to improve product quality."
        }
      />
      <ul className="list-disc space-y-2 pl-5 text-sm text-ink-muted">
        <li>
          {isMy
            ? "Essential cookies - အကောင့်ဝင် session ကိုထားရှိရန်လိုအပ်သည်။"
            : "Essential cookies: required for secure login session handling."}
        </li>
        <li>
          {isMy
            ? "Performance cookies - app performance တိုးတက်စေရန် aggregate metrics ကိုသုံးသည်။"
            : "Performance cookies: help us understand aggregate usage and improve performance."}
        </li>
        <li>
          {isMy
            ? "Advertising cookies - Google AdSense ad delivery နှင့် reporting အတွက် အသုံးပြုနိုင်သည်။"
            : "Advertising cookies: may be used by Google AdSense for ad delivery and reporting."}
        </li>
      </ul>
    </section>
  );
}
