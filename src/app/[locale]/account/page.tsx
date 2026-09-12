import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import AccountProfileCard from "@/components/AccountProfileCard";
import AccountPassportDraftCard from "@/components/AccountPassportDraftCard";
import AccountMyApplicationsCard from "@/components/AccountMyApplicationsCard";
import AccountMyRoomsCard from "@/components/AccountMyRoomsCard";
import AccountDeleteCard from "@/components/AccountDeleteCard";
import ExpiryReminderBanner from "@/components/ExpiryReminderBanner";
import { routing, type AppLocale } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/Card";
import PageCard from "@/components/ui/PageCard";
import { getServerUser } from "@/lib/authz";
import { listApplicationsForApplicant } from "@/lib/jobListings.server";
import { listRoomsForPoster } from "@/lib/roomListings.server";

export const dynamic = "force-dynamic";

type AccountPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const resolvedLocale = locale as AppLocale;
  const t = await getTranslations("account");

  const user = await getServerUser();
  const applications = user
    ? await listApplicationsForApplicant(user.id)
    : [];
  const rooms = user ? await listRoomsForPoster(user.id) : [];

  return (
    <PageCard>
      <section className="space-y-5">
        <PageHeader title={t("pageTitle")} subtitle={t("pageSubtitle")} />
        <AuthGate locale={resolvedLocale}>
          <div className="space-y-5">
            <ExpiryReminderBanner />
            <AccountMyApplicationsCard
              locale={resolvedLocale}
              applications={applications}
            />
            <AccountMyRoomsCard locale={resolvedLocale} rooms={rooms} />
            <AccountPassportDraftCard />
            <AccountProfileCard />
            <AccountDeleteCard />
          </div>
        </AuthGate>
      </section>
    </PageCard>
  );
}
