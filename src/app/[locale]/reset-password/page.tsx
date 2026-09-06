import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { routing, type AppLocale } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/Card";
import PageCard from "@/components/ui/PageCard";

type ResetPasswordPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const t = await getTranslations("auth");

  return (
    <PageCard>
      <section className="mx-auto w-full max-w-md space-y-5">
        <PageHeader title={t("resetPasswordTitle")} subtitle={t("resetPasswordSubtitle")} />
        <ResetPasswordForm locale={locale as AppLocale} />
      </section>
    </PageCard>
  );
}
