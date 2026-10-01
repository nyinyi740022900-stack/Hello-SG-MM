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
              ? "Support မေးခွန်း သို့မဟုတ် sponsorship / partner စိတ်ဝင်စားမှု အတွက် ဖောင်ဖြည့်ပို့နိုင်ပါသည်။"
              : "Support questions, or sponsorship / partner interest — send the form below."
          }
        />

        <div className="rounded-2xl border border-brand/20 bg-brand-soft/40 p-4 text-sm text-ink">
          <p className="font-semibold text-ink">
            {isMy ? "Partner / Sponsor ဖြစ်ချင်ပါသလား?" : "Want to partner or sponsor?"}
          </p>
          <p className="mt-1 text-ink-muted">
            {isMy
              ? "ရွှေ့ပြောင်းအလုပ်သမားများကို ကူညီသော ဝန်ဆောင်မှုများအတွက် banner ad သို့မဟုတ် sponsorship စဉ်းစားနိုင်ပါသည်။ အောက်ပါဖောင်ကို ပို့ပါ။"
              : "Relevant services for migrant workers can book a banner ad or sponsorship. Use the inquiry form below."}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface-muted p-4 text-sm text-ink-muted">
          <a href="mailto:contact@hellosgmm.com" className="text-brand-strong hover:underline">
            contact@hellosgmm.com
          </a>
        </div>

        <SponsorInquiryForm />
      </section>
    </PageCard>
  );
}
