import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PageHeader, Card } from "@/components/ui/Card";
import PageCard from "@/components/ui/PageCard";

type HelpPageProps = {
  params: Promise<{ locale: string }>;
};

const FAQ = {
  en: [
    {
      q: "Is this app free?",
      a: "Yes. Every feature is free, including the PDF exports. The app is supported by ads and community sponsors, so you never have to pay.",
    },
    {
      q: "Where do I get the passport renewal form?",
      a: "Download it from the home page or the Passport Checklist page, print it, then fill it in by hand and sign it before your embassy appointment.",
    },
    {
      q: "I cannot log in after registration. Why?",
      a: "Your email may still be unverified. Open your inbox and confirm your account first.",
    },
    {
      q: "Do I need an account to use the app?",
      a: "No. Guides, the checklist and the forms are open to everyone. An account is only needed to save your details and export your salary record.",
    },
  ],
  my: [
    {
      q: "ဒီ app က အခမဲ့လား?",
      a: "ဟုတ်ပါတယ်။ PDF export အပါအဝင် feature အားလုံး အခမဲ့ ဖြစ်ပါတယ်။ ကြော်ငြာနှင့် sponsor များက ပံ့ပိုးထားလို့ ငွေပေးစရာ လုံးဝ မလိုပါ။",
    },
    {
      q: "ပတ်စပို့ သက်တမ်းတိုး ဖောင်ကို ဘယ်မှာ ရနိုင်လဲ?",
      a: "ပင်မစာမျက်နှာ (သို့) ပတ်စပို့ စာရင်း စာမျက်နှာကနေ download ဆွဲပြီး print ထုတ်ပါ။ ပြီးရင် လက်ရေးနဲ့ ဖြည့်ပြီး လက်မှတ်ထိုးကာ သံရုံးချိန်းသို့ ယူသွားပါ။",
    },
    {
      q: "Register ပြီး login မရတာ ဘာကြောင့်လဲ?",
      a: "Email verify မပြီးသေးလို့ ဖြစ်နိုင်ပါတယ်။ inbox ထဲက confirmation link ကိုနှိပ်ပါ။",
    },
    {
      q: "App သုံးဖို့ အကောင့် လိုအပ်လား?",
      a: "မလိုပါ။ လမ်းညွှန်၊ စာရင်းနှင့် ဖောင်များကို အားလုံး ကြည့်နိုင်ပါတယ်။ အချက်အလက် သိမ်းဆည်းဖို့နှင့် လစာမှတ်တမ်း ထုတ်ယူဖို့အတွက်သာ အကောင့် လိုအပ်ပါသည်။",
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
    <PageCard>
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
    </PageCard>
  );
}
