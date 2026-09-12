import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { PageHeader, Card } from "@/components/ui/Card";
import PageCard from "@/components/ui/PageCard";
import AuthGate from "@/components/AuthGate";
import StatusMessage from "@/components/ui/StatusMessage";
import JobListingForm from "@/components/JobListingForm";
import { routing, type AppLocale } from "@/i18n/routing";

export default async function JobsPostPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const resolvedLocale = locale as AppLocale;
  const t = await getTranslations("jobs");

  return (
    <PageCard>
      <section className="space-y-6">
        <div>
          <Link
            href="/jobs"
            locale={resolvedLocale}
            className="text-sm font-medium text-brand-strong underline"
          >
            {t("backToList")}
          </Link>
        </div>
        <PageHeader eyebrow={t("badge")} title={t("postTitle")} subtitle={t("postSubtitle")} />
        <StatusMessage variant="info">{t("agencyOnlyNote")}</StatusMessage>
        <AuthGate locale={resolvedLocale}>
          <Card className="space-y-4">
            <JobListingForm />
          </Card>
        </AuthGate>
      </section>
    </PageCard>
  );
}
