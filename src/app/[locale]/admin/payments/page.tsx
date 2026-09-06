import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import AdminPaymentReviewPanel from "@/components/AdminPaymentReviewPanel";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/Card";

type AdminPaymentsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminPaymentsPage({ params }: AdminPaymentsPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <PageHeader
        title="Admin Payment Review"
        subtitle="Review pending manual payments and change status to completed or failed."
      />
      <AdminPaymentReviewPanel />
    </section>
  );
}
