import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import ManualPaymentForm from "@/components/ManualPaymentForm";
import UserPaymentHistorySection from "@/components/UserPaymentHistorySection";
import { routing, type AppLocale } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/Card";

type ManualPaymentPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ManualPaymentPage({ params }: ManualPaymentPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <section className="space-y-5">
      <PageHeader
        title="Manual Payment"
        subtitle="Submit KBZPay/WavePay payment proof for premium passport PDF export."
      />
      <AuthGate locale={locale as AppLocale}>
        <div className="space-y-4">
          <ManualPaymentForm />
          <UserPaymentHistorySection />
        </div>
      </AuthGate>
    </section>
  );
}
