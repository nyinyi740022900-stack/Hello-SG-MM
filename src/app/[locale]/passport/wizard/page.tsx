import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import PassportWizardForm from "@/components/PassportWizardForm";
import { PageHeader } from "@/components/ui/Card";
import StatusMessage from "@/components/ui/StatusMessage";
import { routing } from "@/i18n/routing";
import PageCard from "@/components/ui/PageCard";
import CountryMissionCard from "@/components/CountryMissionCard";
import { resolveSelectedCountry } from "@/lib/country.server";
import PageDiscussionSection from "@/components/PageDiscussionSection";

type PassportWizardPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function PassportWizardPage({ params }: PassportWizardPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations("wizard");
  const tCountry = await getTranslations("country");
  const country = await resolveSelectedCountry();

  // The wizard prepares the Myanmar embassy's own renewal form, field by
  // field. There is no generic version of it: another country's form asks for
  // different things on a different sheet. Rather than present a Myanmar form
  // to someone who cannot use it, send them to their own mission.
  if (!country.hasLocalPassportGuide) {
    return (
      <PageCard>
        <section className="space-y-5">
          <PageHeader eyebrow={t("badge")} title={t("title")} />
          {/* Mission card first, notice second — the notice ends by pointing
              at "the official links above", so they have to be above it. */}
          <CountryMissionCard country={country} />
          <StatusMessage variant="info">
            <span className="block space-y-1">
              <span className="block font-medium">
                {tCountry("noGuideTitle", { country: country.englishName })}
              </span>
              <span className="block">{tCountry("noGuideBody")}</span>
            </span>
          </StatusMessage>
          <PageDiscussionSection pageKey="passport-wizard" />
        </section>
      </PageCard>
    );
  }

  return (
    <PageCard>
      <section className="space-y-5">
        <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

        <StatusMessage variant="info">{t("lockNote")}</StatusMessage>

        <PassportWizardForm />

        <p className="text-xs text-ink-subtle">{t("sourceDisclaimer")}</p>
        <PageDiscussionSection pageKey="passport-wizard" />
      </section>
    </PageCard>
  );
}
