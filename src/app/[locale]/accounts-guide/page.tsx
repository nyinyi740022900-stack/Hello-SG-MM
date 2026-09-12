import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { PageHeader, Card } from "@/components/ui/Card";
import StatusMessage from "@/components/ui/StatusMessage";
import { routing } from "@/i18n/routing";
import { BankIcon, TransferIcon, IdCardIcon, WalletIcon } from "@/components/icons";
import PageCard from "@/components/ui/PageCard";
import {
  ACCOUNT_KEYS,
  ACCOUNT_MAP_LINKS,
  ACCOUNT_OFFICIAL_LINKS,
  ACCOUNT_STEP_KEYS,
} from "@/lib/accountsGuide";
import {
  getActiveReferralLinks,
  groupReferralsByPlacement,
} from "@/lib/referralLinks.server";
import ReferralLinkCards from "@/components/ReferralLinkCards";
import PageDiscussionSection from "@/components/PageDiscussionSection";

const ACCOUNT_ICONS = {
  bank: BankIcon,
  paynow: TransferIcon,
  singpass: IdCardIcon,
  grabpay: WalletIcon,
} as const;

const EXTERNAL_LINK_CLASS =
  "flex items-center justify-between rounded-xl border border-border bg-surface-muted p-3 text-ink hover:bg-brand-soft";

function StepNumber({ index }: { index: number }) {
  return (
    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
      {index + 1}
    </span>
  );
}

export default async function AccountsGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations("accountsGuide");
  const referrals = groupReferralsByPlacement(await getActiveReferralLinks());

  return (
    <PageCard>
      <section className="space-y-6">
        <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

        <StatusMessage variant="warning">{t("bnplNote")}</StatusMessage>
        <StatusMessage variant="info">{t("safetyNote")}</StatusMessage>

        <div className="space-y-5">
          {ACCOUNT_KEYS.map((key) => {
            const Icon = ACCOUNT_ICONS[key];
            const steps = ACCOUNT_STEP_KEYS[key];
            const links = ACCOUNT_OFFICIAL_LINKS[key];
            const cardReferrals = referrals[key];

            return (
              <Card key={key} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink">{t(`accounts.${key}.name`)}</h3>
                    <p className="text-xs text-ink-subtle">{t(`accounts.${key}.tagline`)}</p>
                  </div>
                </div>

                <p className="text-sm text-ink-muted">
                  <span className="font-medium text-ink">{t("whyLabel")}: </span>
                  {t(`accounts.${key}.why`)}
                </p>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-ink">{t("howLabel")}</p>
                  <ul className="space-y-2">
                    {steps.map((step, index) => (
                      <li key={step} className="flex items-start gap-3">
                        <StepNumber index={index} />
                        <span className="text-sm text-ink">
                          {t(`accounts.${key}.steps.${step}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-ink">{t("linksLabel")}</p>
                  <ul className="space-y-2">
                    {links.map(({ id, href }) => (
                      <li key={id}>
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={EXTERNAL_LINK_CLASS}
                        >
                          <span className="text-sm">{t(`accounts.${key}.links.${id}`)}</span>
                          <span aria-hidden="true" className="text-ink-subtle">
                            →
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {cardReferrals.length > 0 ? (
                  <div className="space-y-2 border-t border-border pt-3">
                    <p className="text-sm font-medium text-ink">{t("partnerLinksTitle")}</p>
                    <ReferralLinkCards
                      links={cardReferrals}
                      affiliateLabel={t("affiliateBadge")}
                      invitationLabel={t("invitationBadge")}
                      sponsoredNote={t("sponsoredNote")}
                    />
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("mapsTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("mapsSubtitle")}</p>
          <ul className="space-y-2">
            {ACCOUNT_MAP_LINKS.map(({ id, href }) => (
              <li key={id}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={EXTERNAL_LINK_CLASS}
                >
                  <span className="text-sm">{t(`maps.${id}`)}</span>
                  <span aria-hidden="true" className="text-ink-subtle">
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Card>

        {referrals.page.length > 0 ? (
          <Card className="space-y-3">
            <h3 className="font-semibold text-ink">{t("pagePartnersTitle")}</h3>
            <p className="text-sm text-ink-muted">{t("pagePartnersSubtitle")}</p>
            <ReferralLinkCards
              links={referrals.page}
              affiliateLabel={t("affiliateBadge")}
              invitationLabel={t("invitationBadge")}
              sponsoredNote={t("sponsoredNote")}
            />
          </Card>
        ) : null}

        <p className="text-xs text-ink-subtle">{t("disclaimer")}</p>
        <PageDiscussionSection pageKey="accounts-guide" />
      </section>
    </PageCard>
  );
}
