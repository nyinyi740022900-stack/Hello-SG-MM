import { getTranslations } from "next-intl/server";
import Script from "next/script";
import { Link } from "@/i18n/navigation";
import AdBanner from "@/components/AdBanner";
import GoogleAdSlot from "@/components/GoogleAdSlot";
import ExpiryReminderBanner from "@/components/ExpiryReminderBanner";
import ExchangeRateBar from "@/components/ExchangeRateBar";
import SgConditionsBar from "@/components/SgConditionsBar";
import CategoryBadge from "@/components/CategoryBadge";
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
  WizardIcon,
} from "@/components/icons";
import type { AppLocale } from "@/i18n/routing";
import {
  listPublishedContent,
  listUpcomingEvents,
  CONTENT_CATEGORIES,
  type ContentItem,
  type ContentCategory,
} from "@/lib/content";
import { PASSPORT_FORM_DOWNLOAD_PATHS } from "@/lib/passportForms";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

/** Headlines needed in a topic before it earns its own section. */
const MIN_ITEMS_PER_SECTION = 2;
const HEADLINES_IN_LEAD = 12;
const HEADLINES_PER_SECTION = 4;

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = (await params) as { locale: AppLocale };
  const t = await getTranslations("home");
  const tNews = await getTranslations("news");
  const tEvents = await getTranslations("events");
  const tForms = await getTranslations("formDownloads");
  const adSenseClientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;
  const homeAdSlot = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_HOME_SLOT_ID;
  const isMy = locale === "my";

  const { data: allNews } = await listPublishedContent({ type: "news", limit: 60 });
  const news = allNews ?? [];

  const urgentItem = news.find((item) => item.priority === "urgent") ?? null;
  const rest = news.filter((item) => item.id !== urgentItem?.id);
  const lead = rest.slice(0, HEADLINES_IN_LEAD);

  // Anything past the lead block is grouped into topic sections, so a long
  // feed reads as a portal rather than one endless list.
  const overflow = rest.slice(HEADLINES_IN_LEAD);
  const byCategory = new Map<ContentCategory, ContentItem[]>();
  for (const item of overflow) {
    const bucket = byCategory.get(item.category) ?? [];
    bucket.push(item);
    byCategory.set(item.category, bucket);
  }
  const sections = CONTENT_CATEGORIES.map((category) => ({
    category,
    items: (byCategory.get(category) ?? []).slice(0, HEADLINES_PER_SECTION),
  })).filter((section) => section.items.length >= MIN_ITEMS_PER_SECTION);

  const { data: upcomingEvents } = await listUpcomingEvents(3);
  const events = upcomingEvents ?? [];

  const dateFmt = (value: string) =>
    new Date(value).toLocaleDateString(isMy ? "my-MM" : "en-SG", { dateStyle: "medium" });

  const shortcuts = [
    { href: "/passport/wizard", icon: WizardIcon, label: t("ctaStart") },
    { href: "/passport/checklist", icon: ChecklistIcon, label: t("quickChecklist") },
    { href: "/emergency-contacts", icon: PhoneAlertIcon, label: t("quickEmergency") },
    { href: "/guide", icon: GuideIcon, label: t("quickGuide") },
    { href: "/salary-log", icon: ReceiptIcon, label: t("toolSalaryLog") },
    { href: "/recruitment-fee", icon: CalculatorIcon, label: t("toolRecruitmentFee") },
    { href: "/rest-day-rights", icon: CalendarCheckIcon, label: t("toolRestDay") },
    { href: "/off-day-guide", icon: MapPinIcon, label: t("toolOffDayGuide") },
    { href: "/accounts-guide", icon: BankIcon, label: t("quickAccountsGuide") },
    { href: "/events", icon: MegaphoneIcon, label: tEvents("badge") },
  ];

  /** One dense headline row — the portal's basic unit. */
  const headlineRow = (item: ContentItem) => (
    <li key={item.id}>
      <Link
        href={`/news/${item.slug ?? ""}`}
        locale={locale}
        className="flex flex-col gap-1 px-4 py-3 transition hover:bg-brand-soft"
      >
        <span className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={item.category} />
          {item.published_at ? (
            <span className="text-xs text-ink-subtle">{dateFmt(item.published_at)}</span>
          ) : null}
        </span>
        <span className="font-medium leading-snug text-ink">
          {isMy ? item.title_my : item.title_en}
        </span>
      </Link>
    </li>
  );

  return (
    <section className="space-y-5">
      <ExpiryReminderBanner />

      <SgConditionsBar />

      <ExchangeRateBar locale={locale} />

      {/* Compact icon grid — navigation stays reachable without taking the
          page over, so the feed below is what the page is actually about. */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
          {t("shortcutsTitle")}
        </h2>
        <div className="grid grid-cols-4 gap-x-2 gap-y-3 rounded-2xl border border-border bg-surface p-3 sm:grid-cols-6">
          {shortcuts.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              locale={locale}
              className="flex flex-col items-center gap-1.5 self-start rounded-xl p-1.5 text-center transition hover:bg-brand-soft"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
                <Icon className="h-5 w-5" />
              </span>
              <span className="line-clamp-2 text-[11px] leading-tight text-ink-muted">
                {label}
              </span>
            </Link>
          ))}
          <a
            href={PASSPORT_FORM_DOWNLOAD_PATHS.general}
            download
            className="flex flex-col items-center gap-1.5 self-start rounded-xl p-1.5 text-center transition hover:bg-brand-soft"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-base text-brand-strong">
              📄
            </span>
            <span className="line-clamp-2 text-[11px] leading-tight text-ink-muted">
              {t("formGeneralShort")}
            </span>
          </a>
          <a
            href={PASSPORT_FORM_DOWNLOAD_PATHS.maid}
            download
            className="flex flex-col items-center gap-1.5 self-start rounded-xl p-1.5 text-center transition hover:bg-brand-soft"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-base text-brand-strong">
              📄
            </span>
            <span className="line-clamp-2 text-[11px] leading-tight text-ink-muted">
              {t("formMaidShort")}
            </span>
          </a>
        </div>
      </div>

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
            <span className="block font-semibold text-ink">
              {isMy ? urgentItem.title_my : urgentItem.title_en}
            </span>
            {urgentItem.summary_my || urgentItem.summary_en ? (
              <span className="mt-1 block text-sm text-ink-muted">
                {isMy ? urgentItem.summary_my : urgentItem.summary_en}
              </span>
            ) : null}
          </span>
        </Link>
      ) : null}

      {/* The lead feed — the main event on this page. */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-subtle">
            {t("topNewsTitle")}
          </h2>
          <Link
            href="/news"
            locale={locale}
            className="text-xs font-semibold text-brand-strong hover:underline"
          >
            {t("seeAllNews")}
          </Link>
        </div>

        {lead.length > 0 ? (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {lead.map(headlineRow)}
          </ul>
        ) : (
          <p className="rounded-2xl border border-border bg-surface p-4 text-sm text-ink-muted">
            {t("feedEmpty")}
          </p>
        )}

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

      {/* Topic sections, only where there is enough to justify one. */}
      {sections.map(({ category, items }) => (
        <div key={category} className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-ink">{tNews(`category.${category}`)}</h2>
            <Link
              href={`/news?category=${category}`}
              locale={locale}
              className="text-xs font-semibold text-brand-strong hover:underline"
            >
              {t("viewMore")}
            </Link>
          </div>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {items.map(headlineRow)}
          </ul>
        </div>
      ))}

      {events.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-subtle">
              {t("eventsTitle")}
            </h2>
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
              <li key={event.id} className="rounded-2xl border border-border bg-surface p-4">
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

      <p className="text-xs text-ink-subtle">{tForms("hint")}</p>
    </section>
  );
}
