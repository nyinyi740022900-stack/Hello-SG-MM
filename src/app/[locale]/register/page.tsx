import AuthForm from "@/components/AuthForm";
import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/ui/Card";
import PageCard from "@/components/ui/PageCard";

type RegisterPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const tAuth = await getTranslations("auth");
  const tLegal = await getTranslations("legal");

  return (
    <PageCard>
      <section className="mx-auto w-full max-w-md space-y-5">
        <PageHeader title={tAuth("registerTitle")} subtitle={tAuth("registerSubtitle")} />

        <AuthForm locale={locale as AppLocale} mode="register" />

        {/* ── Privacy & Terms consent notice ── */}
        <p className="text-center text-xs text-ink-subtle">
          {tLegal.rich("registerConsent", {
            terms: (chunks) => (
              <Link href="/terms" className="underline hover:text-ink-muted">
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="/privacy" className="underline hover:text-ink-muted">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </section>
    </PageCard>
  );
}
