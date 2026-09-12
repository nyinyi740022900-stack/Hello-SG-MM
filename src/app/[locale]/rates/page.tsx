import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader, Card } from "@/components/ui/Card";
import { routing } from "@/i18n/routing";
import PageCard from "@/components/ui/PageCard";
import StatusMessage from "@/components/ui/StatusMessage";
import { listLatestRates, formatRate, formatObservedAt } from "@/lib/exchangeRates";
import ExchangeRatePanel from "@/components/ExchangeRatePanel";
import { RatePanelSkeleton } from "@/components/PanelSkeleton";
import { resolveSelectedCountry, getSelectedCountryCode } from "@/lib/country.server";
import PageDiscussionSection from "@/components/PageDiscussionSection";
import ReferralLinkCards from "@/components/ReferralLinkCards";
import {
  getActiveReferralLinks,
  groupReferralsByPlacement,
} from "@/lib/referralLinks.server";
import {
  CHANNEL_KEYS,
  HUB_MAPS,
  MISTAKE_KEYS,
  OFFICIAL_LINKS,
  SAFE_SEND_KEYS,
} from "@/lib/remittanceGuide";

function StepNumber({ index }: { index: number }) {
  return (
    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
      {index + 1}
    </span>
  );
}

export default async function RatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations("rates");
  const tAccounts = await getTranslations("accountsGuide");

  const [country, selectedCountry, referralGroups] = await Promise.all([
    resolveSelectedCountry(),
    getSelectedCountryCode(),
    getActiveReferralLinks().then(groupReferralsByPlacement),
  ]);
  const { data: rates } = await listLatestRates(`SGD_${country.currency}`);

  const compareKeys =
    country.code === "mm" ? (["compareFee", "compareOfficial"] as const) : (["compareFee"] as const);
  const remittancePartners = referralGroups.remittance;

  const orderedList = (keys: readonly string[], prefix: string) => (
    <ul className="space-y-3">
      {keys.map((key, index) => (
        <li key={key} className="flex items-start gap-3">
          <StepNumber index={index} />
          <span className="text-ink">{t(`${prefix}.${key}`)}</span>
        </li>
      ))}
    </ul>
  );

  const bulletList = (keys: readonly string[], prefix: string) => (
    <ul className="space-y-2">
      {keys.map((key) => (
        <li key={key} className="flex items-start gap-2 text-ink">
          <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
          <span>{t(`${prefix}.${key}`)}</span>
        </li>
      ))}
    </ul>
  );

  const externalLinks = (
    items: readonly { id: string; href: string }[],
    labelNs: string,
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
            <span>{t(`${labelNs}.${id}`)}</span>
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
        <PageHeader
          eyebrow={t("pageBadge")}
          title={t("pageTitle", { currency: country.currency })}
          subtitle={t("pageSubtitle")}
        />

        <StatusMessage variant="warning">{t("topWarning")}</StatusMessage>

        <Suspense fallback={<RatePanelSkeleton />}>
          <ExchangeRatePanel locale={locale} selectedCountry={selectedCountry} />
        </Suspense>

        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-ink">{t("latestTitle")}</h3>
            <span className="inline-flex shrink-0 rounded-full border border-brand-soft-border bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-strong">
              {t("indicative")}
            </span>
          </div>

          {rates && rates.length > 0 ? (
            <ul className="space-y-2">
              {rates.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-muted p-3"
                >
                  <div>
                    <p className="font-medium text-ink">
                      {row.source_name ?? t(`provider.${row.provider}`)}
                    </p>
                    <p className="text-xs text-ink-subtle">
                      {formatObservedAt(row.observed_at, locale)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-ink">{formatRate(row.rate, locale)}</p>
                    <p className="text-xs text-ink-subtle">{t("perSgd")}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-border bg-surface-muted p-4 text-center text-sm text-ink-muted">
              {t("noData")}
            </div>
          )}

          <p className="text-xs text-ink-subtle">{t("disclaimer")}</p>
        </Card>

        {country.code === "mm" ? (
          <StatusMessage variant="error">{t("myanmarOfficialAlert")}</StatusMessage>
        ) : null}

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("safeSendTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("safeSendIntro")}</p>
          {orderedList(SAFE_SEND_KEYS, "safeSend")}
        </Card>

        {remittancePartners.length > 0 ? (
          <Card className="space-y-3">
            <h3 className="font-semibold text-ink">{t("partnersTitle")}</h3>
            <p className="text-sm text-ink-muted">{t("partnersSubtitle")}</p>
            <ReferralLinkCards
              links={remittancePartners}
              affiliateLabel={tAccounts("affiliateBadge")}
              invitationLabel={tAccounts("invitationBadge")}
              sponsoredNote={tAccounts("sponsoredNote")}
            />
          </Card>
        ) : null}

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("channelsTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("channelsIntro")}</p>
          {bulletList(CHANNEL_KEYS, "channels")}
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("hubsTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("hubsSubtitle")}</p>
          {externalLinks(HUB_MAPS, "hubs")}
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("checkTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("checkIntro")}</p>
          {externalLinks(OFFICIAL_LINKS, "official")}
          <p className="text-xs text-ink-subtle">{t("providersNote")}</p>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("compareTitle")}</h3>
          <ul className="space-y-2 text-ink">
            {compareKeys.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
          <div className="rounded-xl border border-border bg-warning-soft p-3">
            <p className="font-medium text-warning">{t("compareLicence")}</p>
          </div>
        </Card>

        <div className="space-y-3 rounded-2xl border border-border bg-warning-soft p-4 sm:p-5">
          <h3 className="font-semibold text-warning">{t("mistakesTitle")}</h3>
          <ul className="space-y-2">
            {MISTAKE_KEYS.map((key) => (
              <li key={key} className="flex items-start gap-2 text-ink">
                <span aria-hidden="true" className="mt-0.5 shrink-0 font-bold text-warning">
                  &#9888;
                </span>
                <span>{t(`mistakes.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-ink-subtle">{t("guideDisclaimer")}</p>
        <PageDiscussionSection pageKey="rates" />
      </section>
    </PageCard>
  );
}
