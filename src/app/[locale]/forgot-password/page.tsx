import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import { Link } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/Card";
import PageCard from "@/components/ui/PageCard";

type ForgotPasswordPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ForgotPasswordPage({ params }: ForgotPasswordPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const t = await getTranslations("auth");

  return (
    <PageCard>
      <section className="mx-auto w-full max-w-md space-y-5">
        <PageHeader title={t("forgotPasswordTitle")} subtitle={t("forgotPasswordSubtitle")} />
        <ForgotPasswordForm locale={locale as AppLocale} />
        <p className="text-xs text-ink-subtle">
          <Link href="/login" locale={locale as AppLocale} className="underline hover:text-ink-muted">
            {t("backToLogin")}
          </Link>
        </p>
      </section>
    </PageCard>
  );
}
