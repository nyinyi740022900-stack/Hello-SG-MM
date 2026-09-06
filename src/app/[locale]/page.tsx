import { getTranslations } from "next-intl/server";
import Script from "next/script";
import { Link } from "@/i18n/navigation";
import AdBanner from "@/components/AdBanner";
import GoogleAdSlot from "@/components/GoogleAdSlot";
import ExpiryReminderBanner from "@/components/ExpiryReminderBanner";
import PassportFormDownloads from "@/components/PassportFormDownloads";
import ExchangeRateBar from "@/components/ExchangeRateBar";
import CategoryBadge from "@/components/CategoryBadge";
import { LinkButton } from "@/components/ui/Button";
import {
  ChecklistIcon,
  GuideIcon,
  PhoneAlertIcon,
  ReceiptIcon,
  CalculatorIcon,
  CalendarCheckIcon,
  MapPinIcon,
  MegaphoneIcon,
  BankIcon,
} from "@/components/icons";
import type { AppLocale } from "@/i18n/routing";
import { listPublishedContent, listUpcomingEvents, CONTENT_CATEGORIES } from "@/lib/content";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = (await params) as { locale: AppLocale };
  const t = await getTranslations("home");
  const tNews = await getTranslations("news");
  const tEvents = await getTranslations("events");
  const adSenseClientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;
  const homeAdSlot = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_HOME_SLOT_ID;
  const isMy = locale === "my";

  const quickLinks = [
    { href: "/passport/checklist", icon: ChecklistIcon, label: t("quickChecklist") },
    { href: "/emergency-contacts", icon: PhoneAlertIcon, label: t("quickEmergency") },
    { href: "/guide", icon: GuideIcon, label: t("quickGuide") },
    { href: "/accounts-guide", icon: BankIcon, label: t("quickAccountsGuide") },
  ];

  // One query feeds both the urgent strip and the headline list. Volume is a
  // handful of items a day, so splitting them in JS beats a second round trip.
  const { data: latestNews } = await listPublishedContent({ type: "news", limit: 8 });
  const news = latestNews ?? [];
  const urgentItem = news.find((item) => item.priority === "urgent") ?? null;
  const headlines = news.filter((item) => item.id !== urgentItem?.id).slice(0, 5);

  const { data: upcomingEvents } = await listUpcomingEvents(3);
  const events = upcomingEvents ?? [];

  const dateFmt = (value: string) =>
    new Date(value).toLocaleDateString(isMy ? "my-MM" : "en-SG", { dateStyle: "medium" });

  return (
    <section className="space-y-6">
      <ExpiryReminderBanner />

      {urgentItem ? (
        <Link
          href={`/news/${urgentItem.slug ?? ""}`}
          locale={locale}
          className="flex items-start gap-3 rounded-2xl border border-danger-border bg-danger-soft p-4 transition hover:opacity-90"
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-danger">
            <MegaphoneIcon className="h-4.5 w-4.5" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-wide text-danger">
              {t("urgentLabel")}
            </span>
            <span className="block font-medium text-ink">
              {isMy ? urgentItem.title_my : urgentItem.title_en}
            </span>
          </span>
        </Link>
      ) : null}

      <ExchangeRateBar locale={locale} />

      <div className="overflow-hidden rounded-2xl border border-brand-soft-border bg-brand-soft p-6">
        <div className="space-y-3">
          <p className="inline-flex rounded-full border border-brand-soft-border bg-surface px-3 py-1 text-xs font-semibold text-brand-strong">
            {t("badge")}
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{t("title")}</h2>
          <p className="max-w-xl text-ink-muted">{t("subtitle")}</p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/passport/wizard" locale={locale}>
              {t("ctaStart")}
            </LinkButton>
            <LinkButton href="/passport/checklist" locale={locale} variant="secondary">
              {t("ctaChecklist")}
            </LinkButton>
          </div>
        </div>
      </div>

      {headlines.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-subtle">
              {t("topNewsTitle")}
            </h3>
            <Link
              href="/news"
              locale={locale}
              className="text-xs font-semibold text-brand-strong hover:underline"
            >
              {t("seeAllNews")}
            </Link>
          </div>

          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {headlines.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/news/${item.slug ?? ""}`}
                  locale={locale}
                  className="flex flex-col gap-1.5 p-4 transition hover:bg-brand-soft"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <CategoryBadge category={item.category} />
                    {item.published_at ? (
                      <span className="text-xs text-ink-subtle">{dateFmt(item.published_at)}</span>
                    ) : null}
                  </span>
                  <span className="font-medium text-ink">
                    {isMy ? item.title_my : item.title_en}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="-mx-1 overflow-x-auto pb-1">
            <div className="flex gap-2 px-1">
              {CONTENT_CATEGORIES.map((category) => (
                <Link
                  key={category}
                  href={`/news?category=${category}`}
                  locale={locale}
                  className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:border-brand hover:text-brand"
                >
                  {tNews(`category.${category}`)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            locale={locale}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-brand-soft-border hover:bg-brand-soft"
          >
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong group-hover:bg-surface">
              <Icon className="h-5.5 w-5.5" />
            </span>
            <span className="font-semibold text-ink">{label}</span>
          </Link>
        ))}
      </div>

      <PassportFormDownloads />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-subtle">
          {t("toolsSectionTitle")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/salary-log"
            locale={locale}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-brand-soft-border hover:bg-brand-soft"
          >
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong group-hover:bg-surface">
              <ReceiptIcon className="h-5.5 w-5.5" />
            </span>
            <span>
              <span className="block font-semibold text-ink">{t("toolSalaryLog")}</span>
              <span className="block text-xs text-ink-subtle">{t("toolSalaryLogHint")}</span>
            </span>
          </Link>
          <Link
            href="/recruitment-fee"
            locale={locale}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-brand-soft-border hover:bg-brand-soft"
          >
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong group-hover:bg-surface">
              <CalculatorIcon className="h-5.5 w-5.5" />
            </span>
            <span>
              <span className="block font-semibold text-ink">{t("toolRecruitmentFee")}</span>
              <span className="block text-xs text-ink-subtle">{t("toolRecruitmentFeeHint")}</span>
            </span>
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-subtle">
          {t("rightsSectionTitle")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/rest-day-rights"
            locale={locale}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-brand-soft-border hover:bg-brand-soft"
          >
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong group-hover:bg-surface">
              <CalendarCheckIcon className="h-5.5 w-5.5" />
            </span>
            <span>
              <span className="block font-semibold text-ink">{t("toolRestDay")}</span>
              <span className="block text-xs text-ink-subtle">{t("toolRestDayHint")}</span>
            </span>
          </Link>
          <Link
            href="/off-day-guide"
            locale={locale}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-brand-soft-border hover:bg-brand-soft"
          >
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong group-hover:bg-surface">
              <MapPinIcon className="h-5.5 w-5.5" />
            </span>
            <span>
              <span className="block font-semibold text-ink">{t("toolOffDayGuide")}</span>
              <span className="block text-xs text-ink-subtle">{t("toolOffDayGuideHint")}</span>
            </span>
          </Link>
        </div>
      </div>

      {events.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-subtle">
              {t("eventsTitle")}
            </h3>
            <Link
              href="/events"
              locale={locale}
              className="text-xs font-semibold text-brand-strong hover:underline"
            >
              {t("seeAllEvents")}
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {events.map((event) => (
              <li
                key={event.id}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                {event.starts_at ? (
                  <p className="text-xs font-semibold text-accent">{dateFmt(event.starts_at)}</p>
                ) : null}
                <p className="mt-1 font-medium text-ink">
                  {isMy ? event.title_my : event.title_en}
                </p>
                {event.location_name ? (
                  <p className="mt-1 text-xs text-ink-subtle">
                    {tEvents("whereLabel")}: {event.location_name}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <AdBanner
        placement="home_bottom"
        sponsorName={t("sponsorLabel")}
        headline={t("sponsorHeadline")}
        description={t("sponsorDescription")}
        ctaText={t("sponsorCta")}
        targetUrl="/owner/income"
      />

      {homeAdSlot ? (
        <>
          {adSenseClientId ? (
            <Script
              id="google-adsense-home"
              async
              strategy="afterInteractive"
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseClientId}`}
              crossOrigin="anonymous"
            />
          ) : null}
          <GoogleAdSlot
            slot={homeAdSlot}
            className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
          />
        </>
      ) : null}
    </section>
  );
}
