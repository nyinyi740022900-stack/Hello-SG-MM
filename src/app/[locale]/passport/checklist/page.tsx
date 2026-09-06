import { getTranslations } from "next-intl/server";
import { PageHeader, Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import StatusMessage from "@/components/ui/StatusMessage";
import PassportFormDownloads from "@/components/PassportFormDownloads";
import CountryMissionCard from "@/components/CountryMissionCard";
import PageCard from "@/components/ui/PageCard";
import { resolveSelectedCountry } from "@/lib/country.server";

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
  const tCountry = await getTranslations("country");
  const country = await resolveSelectedCountry();

  return (
    <PageCard>
      <section className="space-y-5">
        <PageHeader
          eyebrow={t("badge")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <CountryMissionCard country={country} />

        {/* The detailed checklist below was written from, and checked against,
            the Myanmar embassy's own guidance. Showing it to a Bangladeshi or
            Malaysian reader under their own flag would be inventing a
            procedure we have never verified, so the other countries get the
            mission card above and an honest statement of what we do not have
            yet — not a Myanmar checklist with the labels swapped. */}
        {country.hasLocalPassportGuide ? (
          <>
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
          </>
        ) : (
          <StatusMessage variant="info">
            <span className="block space-y-1">
              <span className="block font-medium">
                {tCountry("noGuideTitle", { country: country.englishName })}
              </span>
              <span className="block">{tCountry("noGuideBody")}</span>
            </span>
          </StatusMessage>
        )}
      </section>
    </PageCard>
  );
}
