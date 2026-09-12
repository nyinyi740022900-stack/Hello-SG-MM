import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { PageHeader, Card } from "@/components/ui/Card";
import { routing } from "@/i18n/routing";
import PageCard from "@/components/ui/PageCard";
import StatusMessage from "@/components/ui/StatusMessage";
import PageDiscussionSection from "@/components/PageDiscussionSection";
import ReferralLinkCards from "@/components/ReferralLinkCards";
import TravelGallery from "@/components/TravelGallery";
import {
  getActiveReferralLinks,
  groupReferralsByPlacement,
} from "@/lib/referralLinks.server";
import {
  findReferralForPartner,
  type IncomePartnerKey,
} from "@/lib/referralPartnerMatch";
import {
  DESTINATIONS,
  getDestinationPhotos,
  isTravelDestinationId,
  type TravelDestinationId,
} from "@/lib/travelGuide";
import type { PageDiscussionKey } from "@/lib/pageDiscussionKeys";

const DISCUSSION_BY_DEST: Record<TravelDestinationId, PageDiscussionKey> = {
  jb: "travel-jb",
  melaka: "travel-melaka",
  batam: "travel-batam",
  bintan: "travel-bintan",
  bangkok: "travel-bangkok",
  phuket: "travel-phuket",
};

export const dynamic = "force-dynamic";

function StepNumber({ index }: { index: number }) {
  return (
    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
      {index + 1}
    </span>
  );
}

export default async function TravelDestinationPage({
  params,
}: {
  params: Promise<{ locale: string; destination: string }>;
}) {
  const { locale, destination: raw } = await params;
  if (!hasLocale(routing.locales, locale) || !isTravelDestinationId(raw)) {
    notFound();
  }

  const destination = raw as TravelDestinationId;
  const meta = DESTINATIONS[destination];
  const photos = getDestinationPhotos(destination);
  const t = await getTranslations("travel");
  const tAccounts = await getTranslations("accountsGuide");
  const referralGroups = groupReferralsByPlacement(await getActiveReferralLinks());
  const travelPartners = referralGroups.travel;
  const placeName = t(`destinations.${destination}.name`);
  const bookingWithoutReferral = meta.booking.filter(
    ({ id }) => !findReferralForPartner(travelPartners, id as IncomePartnerKey),
  );
  const d = `guide.${destination}` as const;

  const orderedList = (keys: readonly string[], prefix: string) => (
    <ul className="space-y-3">
      {keys.map((key, index) => (
        <li key={key} className="flex items-start gap-3">
          <StepNumber index={index} />
          <span className="text-ink">{t(`${d}.${prefix}.${key}`)}</span>
        </li>
      ))}
    </ul>
  );

  const bulletList = (keys: readonly string[], prefix: string) => (
    <ul className="space-y-2">
      {keys.map((key) => (
        <li key={key} className="flex items-start gap-2 text-ink">
          <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
          <span>{t(`${d}.${prefix}.${key}`)}</span>
        </li>
      ))}
    </ul>
  );

  const externalLinks = (
    items: readonly { id: string; href: string }[],
    labelPrefix: string,
  ) => (
    <ul className="space-y-2">
      {items.map(({ id, href }) => (
        <li key={id}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-border bg-surface-muted p-3 text-ink hover:bg-brand-soft"
          >
            <span>{t(`${d}.${labelPrefix}.${id}`)}</span>
            <span aria-hidden="true" className="text-ink-subtle">
              &rarr;
            </span>
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <PageCard>
      <section className="space-y-8">
        <div>
          <Link href="/travel" className="text-sm font-medium text-brand-strong hover:underline">
            {t("backToHub")}
          </Link>
        </div>

        <PageHeader
          eyebrow={t(`destinations.${destination}.country`)}
          title={t(`destinations.${destination}.name`)}
          subtitle={`${t(`destinations.${destination}.tagline`)} · ${t(`destinations.${destination}.duration`)}`}
        />

        <StatusMessage variant="warning">{t(`${d}.visaNote`)}</StatusMessage>

        {photos.length > 0 ? (
          <Card className="space-y-3">
            <h3 className="font-semibold text-ink">{t("sectionPhotos")}</h3>
            <TravelGallery
              photos={photos}
              captionFor={(key) => t(`photos.${key}`)}
              creditLabel={t("photoCredit")}
            />
          </Card>
        ) : null}

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("sectionOverview")}</h3>
          <p className="text-ink">{t(`${d}.overview`)}</p>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("sectionNeed")}</h3>
          {orderedList(meta.needKeys, "need")}
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("sectionBooking")}</h3>
          <p className="text-sm text-ink-muted">{t("sectionBookingIntro")}</p>
          {travelPartners.length > 0 ? (
            <ReferralLinkCards
              links={travelPartners}
              affiliateLabel={tAccounts("affiliateBadge")}
              invitationLabel={tAccounts("invitationBadge")}
              sponsoredNote={tAccounts("sponsoredNote")}
              placeName={placeName}
            />
          ) : null}
          {bookingWithoutReferral.length > 0 ? (
            <ul className="space-y-2">
              {bookingWithoutReferral.map(({ id, href }) => (
                <li key={id}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-border bg-surface-muted p-3 text-ink hover:bg-brand-soft"
                  >
                    <span>
                      {t(`bookingCity.${id}`, {
                        place: placeName,
                      })}
                    </span>
                    <span aria-hidden="true" className="text-ink-subtle">
                      &rarr;
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-xs text-ink-subtle">{t("bookingAffiliateNote")}</p>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("sectionHow")}</h3>
          {orderedList(meta.howKeys, "how")}
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("sectionMaps")}</h3>
          {externalLinks(meta.maps, "maps")}
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("sectionPlaces")}</h3>
          {bulletList(meta.placeKeys, "places")}
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("sectionFood")}</h3>
          {bulletList(meta.foodKeys, "food")}
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("sectionBudget")}</h3>
          <p className="text-sm text-ink-muted">{t("budgetIntro")}</p>
          <ul className="space-y-2">
            {meta.budgetKeys.map((key) => (
              <li
                key={key}
                className="flex items-center justify-between rounded-xl border border-border bg-surface-muted p-3"
              >
                <span className="text-ink">{t(`${d}.budgetLabels.${key}`)}</span>
                <span className="font-semibold text-ink">{t(`${d}.budget.${key}`)}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-subtle">{t("budgetNote")}</p>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("sectionOfficial")}</h3>
          {externalLinks(meta.official, "official")}
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("sectionTips")}</h3>
          {bulletList(meta.tipKeys, "tips")}
        </Card>

        <div className="space-y-3 rounded-2xl border border-border bg-warning-soft p-4 sm:p-5">
          <h3 className="font-semibold text-warning">{t("sectionMistakes")}</h3>
          <ul className="space-y-2">
            {meta.mistakeKeys.map((key) => (
              <li key={key} className="flex items-start gap-2 text-ink">
                <span aria-hidden="true" className="mt-0.5 shrink-0 font-bold text-warning">
                  &#9888;
                </span>
                <span>{t(`${d}.mistakes.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-ink-subtle">{t("disclaimer")}</p>
        <PageDiscussionSection pageKey={DISCUSSION_BY_DEST[destination]} />
      </section>
    </PageCard>
  );
}
