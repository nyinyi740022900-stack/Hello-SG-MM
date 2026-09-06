import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import PassportWizardForm from "@/components/PassportWizardForm";
import { PageHeader } from "@/components/ui/Card";
import StatusMessage from "@/components/ui/StatusMessage";
import { routing } from "@/i18n/routing";
import PageCard from "@/components/ui/PageCard";

type PassportWizardPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function PassportWizardPage({ params }: PassportWizardPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations("wizard");

  return (
    <PageCard>
      <section className="space-y-5">
        <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

        <StatusMessage variant="info">{t("lockNote")}</StatusMessage>

        <PassportWizardForm />

        <p className="text-xs text-ink-subtle">{t("sourceDisclaimer")}</p>
      </section>
    </PageCard>
  );
}
