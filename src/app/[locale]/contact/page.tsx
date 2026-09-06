import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import SponsorInquiryForm from "@/components/SponsorInquiryForm";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/Card";
import PageCard from "@/components/ui/PageCard";

type ContactPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const isMy = locale === "my";

  return (
    <PageCard>
      <section className="space-y-5">
        <PageHeader
          title={isMy ? "ဆက်သွယ်ရန်" : "Contact"}
          subtitle={
            isMy
              ? "Support သို့မဟုတ် sponsorship အတွက် ဖောင်ဖြည့်ပို့နိုင်ပါသည်။"
              : "Use this form for sponsorship interest or support inquiries."
          }
        />

        <div className="rounded-2xl border border-border bg-surface-muted p-4 text-sm text-ink-muted">
          support@sgmigrantworkerapp.com
        </div>

        <SponsorInquiryForm />
      </section>
    </PageCard>
  );
}
