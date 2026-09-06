import AuthForm from "@/components/AuthForm";
import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/Card";

type LoginPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const t = await getTranslations("auth");

  return (
    <section className="mx-auto w-full max-w-md space-y-5">
      <PageHeader title={t("loginTitle")} subtitle={t("loginSubtitle")} />
      <AuthForm locale={locale as AppLocale} mode="login" />
    </section>
  );
}
