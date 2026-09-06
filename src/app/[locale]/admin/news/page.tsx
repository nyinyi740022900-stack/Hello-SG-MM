import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import ContentReviewPanel from "@/components/NewsReviewPanel";
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
        title="Content Review"
        subtitle="Check what the agent drafted overnight, fix any wording, verify the source, and publish."
      />
      <ContentReviewPanel />
    </section>
  );
}
