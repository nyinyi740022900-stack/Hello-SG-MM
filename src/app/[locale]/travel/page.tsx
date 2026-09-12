import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { PageHeader, Card } from "@/components/ui/Card";
import { routing } from "@/i18n/routing";
import PageCard from "@/components/ui/PageCard";
import StatusMessage from "@/components/ui/StatusMessage";
import PageDiscussionSection from "@/components/PageDiscussionSection";
import ReferralLinkCards from "@/components/ReferralLinkCards";
import {
  getActiveReferralLinks,
  groupReferralsByPlacement,
} from "@/lib/referralLinks.server";
import {
  bookingFallbacksWithoutReferral,
  findReferralForPartner,
  TRAVEL_PRODUCT_LINK_KEYS,
} from "@/lib/referralPartnerMatch";
import {
  BOOKING_APP_LINKS,
  DESTINATION_IDS,
  HUB_GOVERNMENT_LINKS,
  PREP_KEYS,
  PREP_MISTAKE_KEYS,
  getDestinationHero,
} from "@/lib/travelGuide";

function StepNumber({ index }: { index: number }) {
  return (
    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
      {index + 1}
    </span>
  );
}

export default async function TravelHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations("travel");
  const tAccounts = await getTranslations("accountsGuide");
  const referralGroups = groupReferralsByPlacement(await getActiveReferralLinks());
  const travelPartners = referralGroups.travel;
  const bookingFallbacks = bookingFallbacksWithoutReferral(
    travelPartners,
    BOOKING_APP_LINKS,
  );
  const productFallbacks = TRAVEL_PRODUCT_LINK_KEYS.filter(
    ({ partnerKey }) => !findReferralForPartner(travelPartners, partnerKey),
  );

  return (
    <PageCard>
      <section className="space-y-8">
        <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

        <StatusMessage variant="warning">{t("topWarning")}</StatusMessage>
        <StatusMessage variant="info">{t("incomeNote")}</StatusMessage>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("prepTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("prepIntro")}</p>
          <ul className="space-y-3">
            {PREP_KEYS.map((key, index) => (
              <li key={key} className="flex items-start gap-3">
                <StepNumber index={index} />
                <span className="text-ink">{t(`prep.${key}`)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("toolsTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("toolsIntro")}</p>
          <ul className="space-y-2">
            {HUB_GOVERNMENT_LINKS.map(({ id, href }) => (
              <li key={id}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-muted p-3 text-ink hover:bg-brand-soft"
                >
                  <span>{t(`tools.${id}`)}</span>
                  <span aria-hidden="true" className="text-ink-subtle">
                    &rarr;
                  </span>
                </a>
              </li>
            ))}
            {productFallbacks.map(({ id, href }) => (
              <li key={id}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-muted p-3 text-ink hover:bg-brand-soft"
                >
                  <span>{t(`tools.${id}`)}</span>
                  <span aria-hidden="true" className="text-ink-subtle">
                    &rarr;
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Card>

        {travelPartners.length > 0 ? (
          <Card className="space-y-3">
            <h3 className="font-semibold text-ink">{t("partnersTitle")}</h3>
            <p className="text-sm text-ink-muted">{t("partnersSubtitle")}</p>
            <ReferralLinkCards
              links={travelPartners}
              affiliateLabel={tAccounts("affiliateBadge")}
              invitationLabel={tAccounts("invitationBadge")}
              sponsoredNote={tAccounts("sponsoredNote")}
            />
            {bookingFallbacks.length > 0 ? (
              <>
                <p className="pt-1 text-xs font-medium text-ink-subtle">
                  {t("bookingFallbackLabel")}
                </p>
                <ul className="space-y-2">
                  {bookingFallbacks.map(({ id, href }) => (
                    <li key={id}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-xl border border-border bg-surface-muted p-3 text-sm text-ink hover:bg-brand-soft"
                      >
                        <span>{t(`bookingApps.${id}`)}</span>
                        <span aria-hidden="true" className="text-ink-subtle">
                          &rarr;
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <p className="text-xs text-ink-subtle">{t("bookingAffiliateNote")}</p>
          </Card>
        ) : (
          <Card className="space-y-3">
            <h3 className="font-semibold text-ink">{t("bookingTitle")}</h3>
            <p className="text-sm text-ink-muted">{t("bookingIntro")}</p>
            <ul className="space-y-2">
              {BOOKING_APP_LINKS.map(({ id, href }) => (
                <li key={id}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-border bg-surface-muted p-3 text-ink hover:bg-brand-soft"
                  >
                    <span>{t(`bookingApps.${id}`)}</span>
                    <span aria-hidden="true" className="text-ink-subtle">
                      &rarr;
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-xs text-ink-subtle">{t("bookingAffiliateNote")}</p>
          </Card>
        )}

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("destinationsTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("destinationsIntro")}</p>
          <ul className="space-y-3">
            {DESTINATION_IDS.map((id) => {
              const hero = getDestinationHero(id);
              return (
                <li key={id}>
                  <Link
                    href={`/travel/${id}`}
                    className="flex overflow-hidden rounded-2xl border border-border bg-surface-muted hover:bg-brand-soft"
                  >
                    {hero ? (
                      <span className="relative hidden h-24 w-28 shrink-0 sm:block">
                        <Image
                          src={hero.src}
                          alt={t(`destinations.${id}.name`)}
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      </span>
                    ) : null}
                    <span className="flex flex-1 items-center justify-between gap-3 p-3 text-ink">
                      <span>
                        <span className="block font-medium">
                          {t(`destinations.${id}.name`)}
                        </span>
                        <span className="block text-xs text-ink-subtle">
                          {t(`destinations.${id}.tagline`)} ·{" "}
                          {t(`destinations.${id}.duration`)}
                        </span>
                      </span>
                      <span aria-hidden="true" className="text-ink-subtle">
                        &rarr;
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-3 rounded-2xl border border-border bg-warning-soft p-4 sm:p-5">
          <h3 className="font-semibold text-warning">{t("mistakesTitle")}</h3>
          <ul className="space-y-2">
            {PREP_MISTAKE_KEYS.map((key) => (
              <li key={key} className="flex items-start gap-2 text-ink">
                <span aria-hidden="true" className="mt-0.5 shrink-0 font-bold text-warning">
                  &#9888;
                </span>
                <span>{t(`prepMistakes.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-ink-subtle">{t("disclaimer")}</p>
        <PageDiscussionSection pageKey="travel" />
      </section>
    </PageCard>
  );
}
