import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import SalaryLogPanel from "@/components/SalaryLogPanel";
import { PageHeader } from "@/components/ui/Card";
import { routing, type AppLocale } from "@/i18n/routing";
import PageCard from "@/components/ui/PageCard";
import PageDiscussionSection from "@/components/PageDiscussionSection";

type SalaryLogPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SalaryLogPage({ params }: SalaryLogPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations("salaryLog");

  return (
    <PageCard>
      <section className="space-y-5">
        <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />
        <AuthGate locale={locale as AppLocale}>
          <SalaryLogPanel />
        </AuthGate>
        <PageDiscussionSection pageKey="salary-log" />
      </section>
    </PageCard>
  );
}
