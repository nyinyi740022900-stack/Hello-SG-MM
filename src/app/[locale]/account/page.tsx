import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import AccountProfileCard from "@/components/AccountProfileCard";
import ExpiryReminderBanner from "@/components/ExpiryReminderBanner";
import { routing, type AppLocale } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/Card";

type AccountPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <section className="space-y-5">
      <PageHeader title="My Account" subtitle="Manage your profile." />
      <AuthGate locale={locale as AppLocale}>
        <div className="space-y-5">
          <ExpiryReminderBanner />
          <AccountProfileCard />
        </div>
      </AuthGate>
    </section>
  );
}
