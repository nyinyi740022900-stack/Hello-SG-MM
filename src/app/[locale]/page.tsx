import { getTranslations } from "next-intl/server";
import Script from "next/script";
import { Link } from "@/i18n/navigation";
import AdBanner from "@/components/AdBanner";
import GoogleAdSlot from "@/components/GoogleAdSlot";
import ExpiryReminderBanner from "@/components/ExpiryReminderBanner";
import PassportFormDownloads from "@/components/PassportFormDownloads";
import { Card } from "@/components/ui/Card";
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
import { listPublishedContent } from "@/lib/content";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = (await params) as { locale: AppLocale };
  const t = await getTranslations("home");
  const adSenseClientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;
  const homeAdSlot = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_HOME_SLOT_ID;

  const quickLinks = [
    { href: "/passport/checklist", icon: ChecklistIcon, label: t("quickChecklist") },
    { href: "/emergency-contacts", icon: PhoneAlertIcon, label: t("quickEmergency") },
    { href: "/guide", icon: GuideIcon, label: t("quickGuide") },
    { href: "/accounts-guide", icon: BankIcon, label: t("quickAccountsGuide") },
  ];

  const { data: latestContent } = await listPublishedContent({ limit: 1 });
  const latestItem = latestContent?.[0] ?? null;
  const isMy = locale === "my";

  return (
    <section className="space-y-8">
      <ExpiryReminderBanner />

      {latestItem ? (
        <Link
          href="/news"
          locale={locale}
          className="flex items-center gap-3 rounded-2xl border border-accent-border bg-accent-soft p-4 transition hover:opacity-90"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-accent">
            <MegaphoneIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-wide text-accent">
              {t("latestUpdateLabel")}
            </span>
            <span className="block truncate font-medium text-ink">
              {isMy ? latestItem.title_my : latestItem.title_en}
            </span>
          </span>
        </Link>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-brand-soft-border bg-brand-soft p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-center">
          <div className="space-y-4">
            <p className="inline-flex rounded-full border border-brand-soft-border bg-surface px-3 py-1 text-xs font-semibold text-brand-strong">
              {t("badge")}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {t("title")}
            </h2>
            <p className="max-w-xl text-ink-muted">{t("subtitle")}</p>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/passport/wizard" locale={locale} size="lg">
                {t("ctaStart")}
              </LinkButton>
              <LinkButton href="/passport/checklist" locale={locale} variant="secondary" size="lg">
                {t("ctaChecklist")}
              </LinkButton>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <Card padding="sm">
              <p className="text-xs text-ink-subtle">{t("factGuidedLabel")}</p>
              <p className="mt-1 text-lg font-bold text-ink">{t("factGuidedValue")}</p>
            </Card>
            <Card padding="sm">
              <p className="text-xs text-ink-subtle">{t("factLanguageLabel")}</p>
              <p className="mt-1 text-lg font-bold text-ink">{t("factLanguageValue")}</p>
            </Card>
            <Card padding="sm">
              <p className="text-xs text-ink-subtle">{t("factCostLabel")}</p>
              <p className="mt-1 text-lg font-bold text-ink">{t("factCostValue")}</p>
            </Card>
          </div>
        </div>
      </div>

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
