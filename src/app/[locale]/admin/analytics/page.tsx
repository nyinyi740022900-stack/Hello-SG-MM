import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import AdminAnalyticsDashboard from "@/components/AdminAnalyticsDashboard";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/Card";

type AdminAnalyticsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminAnalyticsPage({ params }: AdminAnalyticsPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <PageHeader
        title="Analytics Dashboard / စာရင်းအင်း"
        subtitle="Overview of revenue, ad performance, and sponsor leads. / ဝင်ငွေ၊ ကြော်ငြာ၊ Sponsor ဦးဆောင်မှု အကျဉ်းချုပ်။"
      />
      <AdminAnalyticsDashboard />
    </section>
  );
}
