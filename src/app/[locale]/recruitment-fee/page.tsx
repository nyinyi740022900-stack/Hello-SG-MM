import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import RecruitmentFeeCalculator from "@/components/RecruitmentFeeCalculator";
import { Card, PageHeader } from "@/components/ui/Card";
import { routing } from "@/i18n/routing";
import PageCard from "@/components/ui/PageCard";
import {
  ACTION_KEYS,
  BEFORE_PAY_KEYS,
  EVIDENCE_KEYS,
  RECRUITMENT_LINKS,
  SUPPORT_MAP_LINKS,
} from "@/lib/recruitmentFeeGuide";
import PageDiscussionSection from "@/components/PageDiscussionSection";

const EXTERNAL_LINK_CLASS = "font-semibold text-brand-strong underline";

function StepNumber({ index }: { index: number }) {
  return (
    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
      {index + 1}
    </span>
  );
}

type RecruitmentFeePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function RecruitmentFeePage({ params }: RecruitmentFeePageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations("recruitmentFee");
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

  return (
    <PageCard>
      <section className="space-y-6">
        <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

        <Card className="space-y-2 border-danger-border bg-danger-soft">
          <h3 className="font-semibold text-danger">{t("warningTitle")}</h3>
          <p className="text-sm text-ink">{t("warningBody")}</p>
        </Card>

        <RecruitmentFeeCalculator />

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("beforePayTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("beforePaySubtitle")}</p>
          {orderedList(BEFORE_PAY_KEYS, "beforePay")}
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("evidenceTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("evidenceSubtitle")}</p>
          {orderedList(EVIDENCE_KEYS, "evidence")}
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("actionTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("actionSubtitle")}</p>
          {orderedList(ACTION_KEYS, "action")}
        </Card>

        <Card className="space-y-2">
          <h3 className="font-semibold text-ink">{t("linksTitle")}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <a href={RECRUITMENT_LINKS.eaDirectory} target="_blank" rel="noopener noreferrer" className={EXTERNAL_LINK_CLASS}>
              {t("links.eaDirectory")}
            </a>
            <a href={RECRUITMENT_LINKS.eaLicensedFaq} target="_blank" rel="noopener noreferrer" className={EXTERNAL_LINK_CLASS}>
              {t("links.eaLicensedFaq")}
            </a>
            <a href={RECRUITMENT_LINKS.reportInfringement} target="_blank" rel="noopener noreferrer" className={EXTERNAL_LINK_CLASS}>
              {t("links.reportInfringement")}
            </a>
            <a href={RECRUITMENT_LINKS.momContact} target="_blank" rel="noopener noreferrer" className={EXTERNAL_LINK_CLASS}>
              {t("links.momContact")}
            </a>
            <a href={RECRUITMENT_LINKS.tadmClaim} target="_blank" rel="noopener noreferrer" className={EXTERNAL_LINK_CLASS}>
              {t("links.tadmClaim")}
            </a>
            <a href={RECRUITMENT_LINKS.tadmFees} target="_blank" rel="noopener noreferrer" className={EXTERNAL_LINK_CLASS}>
              {t("links.tadmFees")}
            </a>
            <a href={RECRUITMENT_LINKS.tadmLocations} target="_blank" rel="noopener noreferrer" className={EXTERNAL_LINK_CLASS}>
              {t("links.tadmLocations")}
            </a>
          </div>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("mapsTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("mapsSubtitle")}</p>
          <ul className="space-y-2">
            {SUPPORT_MAP_LINKS.map(({ id, href }) => (
              <li key={id}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-muted p-3 text-ink hover:bg-brand-soft"
                >
                  <span>{t(`maps.${id}`)}</span>
                  <span aria-hidden="true" className="text-ink-subtle">
                    &rarr;
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Card>
        <PageDiscussionSection pageKey="recruitment-fee" />
      </section>
    </PageCard>
  );
}
