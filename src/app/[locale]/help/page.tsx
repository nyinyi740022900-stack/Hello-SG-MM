import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PageHeader, Card } from "@/components/ui/Card";

type HelpPageProps = {
  params: Promise<{ locale: string }>;
};

const FAQ = {
  en: [
    {
      q: "How do I unlock PDF export?",
      a: "Sign up, submit manual payment proof, and wait for admin approval.",
    },
    {
      q: "I cannot log in after registration. Why?",
      a: "Your email may still be unverified. Open your inbox and confirm your account first.",
    },
    {
      q: "How long does payment review take?",
      a: "Usually 1-2 working days.",
    },
  ],
  my: [
    {
      q: "PDF export ကို ဘယ်လိုဖွင့်မလဲ?",
      a: "အကောင့်ဖွင့်ပြီး manual payment proof တင်ပါ၊ admin အတည်ပြုပြီးမှ ဖွင့်ပေးပါမည်။",
    },
    {
      q: "Register ပြီး login မရတာ ဘာကြောင့်လဲ?",
      a: "Email verify မပြီးသေးလို့ ဖြစ်နိုင်ပါတယ်။ inbox ထဲက confirmation link ကိုနှိပ်ပါ။",
    },
    {
      q: "Payment review ဘယ်လောက်ကြာမလဲ?",
      a: "ပုံမှန်အားဖြင့် လုပ်ငန်းရက် ၁-၂ ရက်ခန့်ကြာပါသည်။",
    },
  ],
} as const;

export default async function HelpPage({ params }: HelpPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const isMy = locale === "my";
  const list = isMy ? FAQ.my : FAQ.en;

  return (
    <section className="space-y-5">
      <PageHeader
        title={isMy ? "အကူအညီ နှင့် FAQ" : "Help & FAQ"}
        subtitle={
          isMy
            ? "အသုံးပြုမှုအတွက် မေးလေ့မေးထရှိသောအချက်များ။"
            : "Answers to common questions about login, payment, and export."
        }
      />

      <div className="space-y-3">
        {list.map((item) => (
          <Card key={item.q} as="article" padding="md" className="space-y-1">
            <h3 className="font-semibold text-ink">{item.q}</h3>
            <p className="text-sm text-ink-muted">{item.a}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
