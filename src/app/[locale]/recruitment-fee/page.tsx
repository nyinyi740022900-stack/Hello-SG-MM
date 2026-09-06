import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import RecruitmentFeeCalculator from "@/components/RecruitmentFeeCalculator";
import { PageHeader } from "@/components/ui/Card";
import { routing } from "@/i18n/routing";

type RecruitmentFeePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function RecruitmentFeePage({ params }: RecruitmentFeePageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations("recruitmentFee");

  return (
    <section className="space-y-5">
      <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />
      <RecruitmentFeeCalculator />
    </section>
  );
}
