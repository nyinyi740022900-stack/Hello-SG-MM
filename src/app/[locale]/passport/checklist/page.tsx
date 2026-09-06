import { getTranslations } from "next-intl/server";
import { PageHeader, Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import StatusMessage from "@/components/ui/StatusMessage";
import PassportFormDownloads from "@/components/PassportFormDownloads";
import PageCard from "@/components/ui/PageCard";

const CHECKLIST_KEYS = [
  "applicationForm",
  "cvForm",
  "taxReceipt",
  "originalPassport",
  "workPermit",
  "photo",
  "dependentDocs",
] as const;

export default async function PassportChecklistPage() {
  const t = await getTranslations("checklist");

  return (
    <PageCard>
      <section className="space-y-5">
        <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

        <StatusMessage variant="warning">
          <span className="block space-y-1">
            <span className="block font-medium">{t("remittanceWarningTitle")}</span>
            <span className="block">{t("remittanceWarningBody")}</span>
          </span>
        </StatusMessage>

        <Card>
          <ul className="space-y-3">
            {CHECKLIST_KEYS.map((key, index) => (
              <li key={key} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
                  {index + 1}
                </span>
                <span className="text-ink">{t(`items.${key}`)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <PassportFormDownloads />

        <div className="flex flex-wrap gap-3">
          <LinkButton href="/guide" variant="secondary">
            {t("ctaGuide")}
          </LinkButton>
          <LinkButton href="/passport/wizard">{t("ctaWizard")}</LinkButton>
        </div>

        <p className="text-xs text-ink-subtle">{t("sourceDisclaimer")}</p>
      </section>
    </PageCard>
  );
}
