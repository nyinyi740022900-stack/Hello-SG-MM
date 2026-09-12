import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { PageHeader, Card } from "@/components/ui/Card";
import { routing } from "@/i18n/routing";
import PageCard from "@/components/ui/PageCard";
import StatusMessage from "@/components/ui/StatusMessage";
import PageDiscussionSection from "@/components/PageDiscussionSection";
import DrivingHelpersSection from "@/components/DrivingHelpersSection";
import { listActiveDrivingHelpers } from "@/lib/drivingHelpers.server";
import {
  CENTRE_MAPS,
  CLASS_KEYS,
  CONVERT_STEP_KEYS,
  DEMERIT_KEYS,
  DOC_KEYS,
  FINE_KEYS,
  LEARNER_KEYS,
  MISTAKE_KEYS,
  OFFICIAL_LINKS,
  OVERVIEW_KEYS,
  PASS_MARK_KEYS,
  TEST_KEYS,
  TRAINING_KEYS,
  VOCATIONAL_KEYS,
} from "@/lib/drivingLicenseGuide";

function StepNumber({ index }: { index: number }) {
  return (
    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
      {index + 1}
    </span>
  );
}

export default async function DrivingLicensePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations("drivingLicense");
  const helpers = await listActiveDrivingHelpers();

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
        <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

        <StatusMessage variant="warning">{t("topWarning")}</StatusMessage>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("overviewTitle")}</h3>
          {bulletList(OVERVIEW_KEYS, "overview")}
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("convertTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("convertIntro")}</p>
          {orderedList(CONVERT_STEP_KEYS, "convertSteps")}
          <StatusMessage variant="info">{t("convertWpNote")}</StatusMessage>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("docsTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("docsIntro")}</p>
          {bulletList(DOC_KEYS, "docs")}
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("testsTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("testsIntro")}</p>
          {bulletList(TEST_KEYS, "tests")}
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("passMarksTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("passMarksIntro")}</p>
          {bulletList(PASS_MARK_KEYS, "passMarks")}
          <StatusMessage variant="info">{t("passMarksNote")}</StatusMessage>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("classesTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("classesIntro")}</p>
          {bulletList(CLASS_KEYS, "classes")}
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("learnerTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("learnerIntro")}</p>
          {orderedList(LEARNER_KEYS, "learner")}
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("trainingTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("trainingIntro")}</p>
          {bulletList(TRAINING_KEYS, "training")}
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("demeritTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("demeritIntro")}</p>
          {bulletList(DEMERIT_KEYS, "demerit")}
          <StatusMessage variant="warning">{t("demeritWarning")}</StatusMessage>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("finesTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("finesIntro")}</p>
          {bulletList(FINE_KEYS, "fines")}
          <StatusMessage variant="error">{t("finesDisclaimer")}</StatusMessage>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("centresTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("centresSubtitle")}</p>
          {externalLinks(CENTRE_MAPS, "centres")}
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("vocationalTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("vocationalIntro")}</p>
          <StatusMessage variant="error">{t("vocationalAlert")}</StatusMessage>
          {bulletList(VOCATIONAL_KEYS, "vocational")}
        </Card>

        <DrivingHelpersSection helpers={helpers} locale={locale} />

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("linksTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("linksSubtitle")}</p>
          {externalLinks(OFFICIAL_LINKS, "links")}
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

        <p className="text-xs text-ink-subtle">{t("disclaimer")}</p>
        <PageDiscussionSection pageKey="driving-license" />
      </section>
    </PageCard>
  );
}
