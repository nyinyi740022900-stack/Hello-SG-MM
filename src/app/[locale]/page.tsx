import { getTranslations } from "next-intl/server";
import Script from "next/script";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import AdBanner from "@/components/AdBanner";
import GoogleAdSlot from "@/components/GoogleAdSlot";
import ExpiryReminderBanner from "@/components/ExpiryReminderBanner";
import { Suspense } from "react";
import ExchangeRatePanel from "@/components/ExchangeRatePanel";
import { ConditionsSkeleton, RatePanelSkeleton } from "@/components/PanelSkeleton";
import { getSelectedCountryCode } from "@/lib/country.server";
import SgConditionsBar from "@/components/SgConditionsBar";
import SearchBar from "@/components/SearchBar";
import { CATEGORY_STYLE } from "@/components/CategoryBadge";
import CategoryTabs from "@/components/CategoryTabs";
import {
  ChecklistIcon,
  DocumentIcon,
  PhoneAlertIcon,
  ReceiptIcon,
  CalculatorIcon,
  CalendarCheckIcon,
  MapPinIcon,
  MegaphoneIcon,
  BankIcon,
  TransferIcon,
} from "@/components/icons";
import type { AppLocale } from "@/i18n/routing";
import {
  listPublishedContent,
  listUpcomingEvents,
  CONTENT_CATEGORIES,
  type ContentItem,
  type ContentCategory,
} from "@/lib/content";
import { getCategoryImages, type CategoryImageMap } from "@/lib/categoryImages";
import { PASSPORT_FORM_DOWNLOAD_PATHS } from "@/lib/passportForms";

type HomePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
};

function isContentCategory(value: string | undefined): value is ContentCategory {
  return Boolean(value) && (CONTENT_CATEGORIES as string[]).includes(value as string);
}

/** Headlines before the first in-feed ad, and between ads after that. */
const ITEMS_BEFORE_FIRST_AD = 6;
const ITEMS_BETWEEN_ADS = 10;

export default async function HomePage({ params, searchParams }: HomePageProps) {
  const { locale } = (await params) as { locale: AppLocale };
  const selectedCountry = await getSelectedCountryCode();
  const { category: rawCategory } = await searchParams;
  // An unknown value falls back to "all" rather than erroring — a stale or
  // hand-edited link should still show the feed.
  const activeCategory = isContentCategory(rawCategory) ? rawCategory : undefined;
  const t = await getTranslations("home");
  const tNews = await getTranslations("news");
  const tCommon = await getTranslations("common");
  const adSenseClientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;
  const homeAdSlot = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_HOME_SLOT_ID;
  const isMy = locale === "my";

  // One round trip, not two. These are independent queries and awaiting them
  // in sequence put the second one's latency directly on the critical path
  // before any HTML could be sent.
  const [{ data: allNews }, { data: upcomingEvents }] = await Promise.all([
    // Twenty-four, not sixty. Every row is real DOM the phone has to lay out
    // and hydrate before it will respond to a tap, and nobody scrolls sixty
    // headlines in a sitting — the extra thirty-six were costing responsiveness
    // on exactly the low-end phones most readers use.
    listPublishedContent({ type: "news", category: activeCategory, limit: 24 }),
    listUpcomingEvents(3),
  ]);
  const news = allNews ?? [];
  // Urgent items stay visible under every filter: an active safety warning is
  // not something to hide because the reader is browsing a different topic.
  const urgentItem = news.find((item) => item.priority === "urgent") ?? null;
  const feed = news.filter((item) => item.id !== urgentItem?.id);

  const events = upcomingEvents ?? [];

  const categoryImages = getCategoryImages();

  const dateFmt = (value: string) =>
    new Date(value).toLocaleDateString(isMy ? "my-MM" : "en-SG", {
      month: "short",
      day: "numeric",
    });

  // Ordered by how often a Myanmar worker actually opens each one in real
  // life, not by feature area. Off-Day Guide and Salary Log are weekly
  // habits; Recruitment Fee and Accounts Guide matter enormously but only
  // once, when a worker first arrives, so they move to the end rather than
  // disappearing — a newly-arrived reader still needs them.
  //
  // Passport used to be three separate tiles (wizard, checklist, guide) for
  // one task. They still all exist and are reachable from the drawer nav and
  // from links on the checklist page itself; the rail keeps only the one
  // entry point, so a first-time reader is not asked to guess which of three
  // icons starts the same job.
  //
  // Directory is added: it is a comparable real-life-urgency need to
  // Emergency Contacts (where do I get help right now) and previously had no
  // shortcut at all despite having live entries.
  //
  // Rates and Events are deliberately absent. Rates duplicates the exchange
  // panel already on this page (see below); Events currently has zero
  // published items, and a shortcut to a reliably empty page costs more
  // trust than an occasional miss from the drawer.
  const shortcuts = [
    { href: "/off-day-guide", icon: MapPinIcon, label: t("toolOffDayGuide") },
    { href: "/salary-log", icon: ReceiptIcon, label: t("toolSalaryLog") },
    { href: "/directory", icon: MapPinIcon, label: tCommon("directory") },
    { href: "/emergency-contacts", icon: PhoneAlertIcon, label: t("quickEmergency") },
    { href: "/passport/checklist", icon: ChecklistIcon, label: t("quickChecklist") },
    { href: "/rest-day-rights", icon: CalendarCheckIcon, label: t("toolRestDay") },
    { href: "/transport", icon: TransferIcon, label: tCommon("transport") },
    { href: "/recruitment-fee", icon: CalculatorIcon, label: t("toolRecruitmentFee") },
    { href: "/accounts-guide", icon: BankIcon, label: t("quickAccountsGuide") },
  ];

  return (
    // Break out of the page shell's padding: a feed reads as a feed only when
    // it runs to the edge of the screen.
    <section className="-mx-4 sm:-mx-6">
      <div className="space-y-2 px-4 pt-1">
        <SearchBar locale={locale} />
        <ExpiryReminderBanner />
      </div>

      {/* One scrolling rail rather than a grid. A grid of nine shortcuts cost
          two rows of vertical space before any news appeared; a rail costs
          one and still reaches everything.

          Placed directly under the search bar, before weather and the rate
          panel: those two wait on third-party APIs (streamed in below via
          Suspense so they never block the page), but the shortcuts are pure
          navigation with nothing to wait for, and they are the reason most
          readers open the app in the first place. Putting them after a full
          screen of weather and exchange rates meant scrolling past both on
          every visit just to reach them. */}
      <div className="relative mt-2 border-y border-border bg-surface py-3">
        <div className="overflow-x-auto">
          <div className="flex gap-1.5 px-3">
            {shortcuts.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                locale={locale}
                className="flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-lg px-1 py-1 text-center transition hover:bg-brand-soft"
              >
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="line-clamp-2 text-xs leading-tight text-ink-muted">
                  {label}
                </span>
              </Link>
            ))}
            <a
              href={PASSPORT_FORM_DOWNLOAD_PATHS.general}
              download
              className="flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-lg px-1 py-1 text-center transition hover:bg-brand-soft"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
                <DocumentIcon className="h-5 w-5" />
              </span>
              <span className="line-clamp-2 text-xs leading-tight text-ink-muted">
                {t("formGeneralShort")}
              </span>
            </a>
            <a
              href={PASSPORT_FORM_DOWNLOAD_PATHS.maid}
              download
              className="flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-lg px-1 py-1 text-center transition hover:bg-brand-soft"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
                <DocumentIcon className="h-5 w-5" />
              </span>
              <span className="line-clamp-2 text-xs leading-tight text-ink-muted">
                {t("formMaidShort")}
              </span>
            </a>
          </div>
        </div>
        {/* A partially-cropped icon at the edge hints there is more, but not
            reliably enough on its own — this fade makes the cut-off explicit
            rather than reading as the rail simply ending. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-surface to-transparent"
        />
      </div>

      <div className="space-y-2 px-4 pt-2">
        {/* Both of these wait on third-party APIs — NEA for weather and haze,
            an exchange rate feed for the panel. Without a boundary here the
            news feed, which is the reason the page exists and comes straight
            from our own database, could not be sent until the slowest of
            those replied. Now the shell and the feed paint first and these
            fill in. */}
        <Suspense fallback={<ConditionsSkeleton />}>
          <SgConditionsBar />
        </Suspense>
        <Suspense fallback={<RatePanelSkeleton />}>
          <ExchangeRatePanel locale={locale} selectedCountry={selectedCountry} />
        </Suspense>
      </div>

      <CategoryTabs locale={locale} activeCategory={activeCategory} />

      {urgentItem ? (
        <Link
          href={`/news/${urgentItem.slug ?? ""}`}
          locale={locale}
          className="flex items-start gap-3 border-b-4 border-danger bg-danger-soft px-4 py-3 transition hover:opacity-90"
        >
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-danger">
            <MegaphoneIcon className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-bold uppercase tracking-wide text-danger">
              {t("urgentLabel")}
            </span>
            <span className="block font-semibold leading-snug text-ink">
              {isMy ? urgentItem.title_my : urgentItem.title_en}
            </span>
          </span>
        </Link>
      ) : null}

      {feed.length > 0 ? (
        <ul className="divide-y divide-border">
          {feed.map((item, index) => (
            <FeedRowWithAd
              key={item.id}
              item={item}
              index={index}
              locale={locale}
              isMy={isMy}
              images={categoryImages}
              dateFmt={dateFmt}
              categoryLabel={tNews(`category.${item.category}`)}
              adSlot={homeAdSlot}
            />
          ))}
        </ul>
      ) : (
        <p className="border-b border-border px-4 py-6 text-sm text-ink-muted">
          {activeCategory ? tNews("emptyInCategory") : t("feedEmpty")}
        </p>
      )}

      {events.length > 0 ? (
        <div className="border-b border-border bg-surface-muted px-4 py-4">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-bold text-ink">{t("eventsTitle")}</h2>
            <Link
              href="/events"
              locale={locale}
              className="text-xs font-semibold text-brand-strong hover:underline"
            >
              {t("seeAllEvents")}
            </Link>
          </div>
          <ul className="space-y-2">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href="/events"
                  locale={locale}
                  className="flex gap-2 text-sm text-ink hover:text-brand"
                >
                  {event.starts_at ? (
                    <span className="shrink-0 font-semibold text-accent">
                      {dateFmt(event.starts_at)}
                    </span>
                  ) : null}
                  <span className="line-clamp-2">{isMy ? event.title_my : event.title_en}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="px-4 py-4">
        <AdBanner
          placement="home_bottom"
          sponsorName={t("sponsorLabel")}
          headline={t("sponsorHeadline")}
          description={t("sponsorDescription")}
          ctaText={t("sponsorCta")}
          targetUrl="/owner/income"
        />
      </div>

      {homeAdSlot && adSenseClientId ? (
        <Script
          id="google-adsense-home"
          async
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseClientId}`}
          crossOrigin="anonymous"
        />
      ) : null}
    </section>
  );
}

/** A headline row, plus an in-feed ad at a fixed cadence after it. */
function FeedRowWithAd({
  item,
  index,
  locale,
  isMy,
  images,
  dateFmt,
  categoryLabel,
  adSlot,
}: {
  item: ContentItem;
  index: number;
  locale: AppLocale;
  isMy: boolean;
  images: CategoryImageMap;
  dateFmt: (value: string) => string;
  categoryLabel: string;
  adSlot?: string;
}) {
  const title = isMy ? item.title_my : item.title_en;
  const thumb = images[item.category];

  // Ads sit between stories at a fixed cadence rather than beside them. Kept
  // deliberately sparse: this audience is on metered mobile data, so every
  // extra unit is a real cost to the reader, not just clutter.
  const showAd =
    Boolean(adSlot) &&
    index + 1 >= ITEMS_BEFORE_FIRST_AD &&
    (index + 1 - ITEMS_BEFORE_FIRST_AD) % ITEMS_BETWEEN_ADS === 0;

  return (
    <>
      <li>
        <Link
          href={`/news/${item.slug ?? ""}`}
          locale={locale}
          className="flex gap-3 px-4 py-3 transition hover:bg-brand-soft"
        >
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${CATEGORY_STYLE[item.category]}`}
              >
                {categoryLabel}
              </span>
              {item.published_at ? (
                <span className="text-[11px] text-ink-subtle">{dateFmt(item.published_at)}</span>
              ) : null}
            </span>
            <span className="mt-1 block text-[15px] font-medium leading-snug text-ink">
              {title}
            </span>
          </span>

          {thumb ? (
            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
              <Image
                src={thumb}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </span>
          ) : null}
        </Link>
      </li>

      {showAd && adSlot ? (
        <li className="bg-surface-muted px-4 py-3">
          <GoogleAdSlot slot={adSlot} />
        </li>
      ) : null}
    </>
  );
}
