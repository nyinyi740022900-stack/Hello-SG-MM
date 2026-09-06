import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import NewsReviewPanel from "@/components/NewsReviewPanel";
import { PageHeader } from "@/components/ui/Card";
import { routing } from "@/i18n/routing";

type AdminNewsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminNewsPage({ params }: AdminNewsPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <PageHeader
        title="News & Updates"
        subtitle="Review daily agent submissions and post manual updates for users."
      />
      <NewsReviewPanel />
    </section>
  );
}
