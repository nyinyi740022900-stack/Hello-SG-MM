import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PageHeader, Card } from "@/components/ui/Card";
import PageCard from "@/components/ui/PageCard";
import PageDiscussionSection from "@/components/PageDiscussionSection";
import { Link } from "@/i18n/navigation";

type HelpPageProps = {
  params: Promise<{ locale: string }>;
};

const FAQ = {
  en: [
    {
      q: "Is this app free?",
      a: "Yes. Worker-facing guides and tools, including PDF exports, are free. The app is supported by ads and community sponsors.",
    },
    {
      q: "How can my business sponsor or advertise?",
      a: "Open Contact from the menu (or footer) and send a sponsorship inquiry. We review partners who help migrant workers.",
    },
    {
      q: "Where is the driving licence guide?",
      a: "Open Driving licence from the menu (Tools) or the home shortcuts. It covers conversion, tests, demerit points, maps and official links. Community helpers (if any) are listed there — they are not government staff.",
    },
    {
      q: "Can I ask questions on a guide page?",
      a: "Yes. Many guides have a Q&A section at the bottom. Log in to post, reply or report inappropriate comments.",
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
      a: "No. Guides and checklists are open to everyone. An account is needed to save details, export some reports, and post comments.",
    },
    {
      q: "Privacy, Terms and Cookies?",
      a: "Use the footer links: Privacy Policy, Terms of Service, Cookies Policy, and Contact.",
    },
  ],
  my: [
    {
      q: "ဒီ app က အခမဲ့လား?",
      a: "ဟုတ်ပါတယ်။ အလုပ်သမားများအတွက် လမ်းညွှန်နှင့် ကိရိယာများ (PDF export အပါအဝင်) အခမဲ့ ဖြစ်ပါတယ်။ ကြော်ငြာနှင့် sponsor များက ပံ့ပိုးထားပါတယ်။",
    },
    {
      q: "လုပ်ငန်းကနေ sponsor / ကြော်ငြာ လုပ်ချင်ရင်?",
      a: "Menu သို့မဟုတ် footer ထဲက Contact ကို ဖွင့်ပြီး sponsorship inquiry ပို့ပါ။ ရွှေ့ပြောင်းအလုပ်သမားများကို ကူညီသော partner များကို စိစစ်လက်ခံပါသည်။",
    },
    {
      q: "ယာဉ်မောင်းလိုင်စင် လမ်းညွှန် ဘယ်မှာလဲ?",
      a: "Menu (Tools) သို့မဟုတ် ပင်မ shortcut မှ Driving licence ကို ဖွင့်ပါ။ Conversion၊ စာမေး၊ demerit၊ မြေပုံနှင့် တရားဝင် လင့်ခ်များ ပါသည်။ Community helper ရှိပါက ထိုစာမျက်နှာတွင် ပြသည် — အစိုးရ ဝန်ထမ်း မဟုတ်ပါ။",
    },
    {
      q: "လမ်းညွှန်စာမျက်နှာမှာ မေးခွန်း မေးလို့ရလား?",
      a: "ရပါတယ်။ လမ်းညွှန်များစွာ၏ အောက်ခြေတွင် Q&A ရှိသည်။ မှတ်ချက် / reply / report လုပ်ရန် အကောင့်ဝင်ပါ။",
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
      a: "မလိုပါ။ လမ်းညွှန်နှင့် စာရင်းများကို အားလုံး ကြည့်နိုင်ပါတယ်။ အချက်အလက် သိမ်းရန်၊ အချို့ PDF ထုတ်ရန်နှင့် မှတ်ချက် ရေးရန်အတွက်သာ အကောင့် လိုအပ်ပါသည်။",
    },
    {
      q: "Privacy၊ Terms၊ Cookies ဘယ်မှာလဲ?",
      a: "စာမျက်နှာအောက်ခြေ footer မှ Privacy Policy၊ Terms of Service၊ Cookies Policy နှင့် Contact ကို ဖွင့်ပါ။",
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
              ? "Login၊ လမ်းညွှန်များ၊ မှတ်ချက်များနှင့် ကြော်ငြာဆိုင်ရာ မေးလေ့ရှိသော မေးခွန်းများ။"
              : "Common questions about login, guides, comments and how the free app is funded."
          }
        />

        <p className="text-sm text-ink-muted">
          {isMy ? (
            <>
              ပိုမိုသိရှိရန်{" "}
              <Link href="/contact" className="font-medium text-brand underline">
                Contact
              </Link>{" "}
              သို့မဟုတ် footer ထဲက Privacy / Terms ကို ဖတ်ပါ။
            </>
          ) : (
            <>
              Need more help? Use{" "}
              <Link href="/contact" className="font-medium text-brand underline">
                Contact
              </Link>{" "}
              or read Privacy / Terms in the footer.
            </>
          )}
        </p>

        <div className="space-y-3">
          {list.map((item) => (
            <Card key={item.q} as="article" padding="md" className="space-y-1">
              <h3 className="font-semibold text-ink">{item.q}</h3>
              <p className="text-sm text-ink-muted">{item.a}</p>
            </Card>
          ))}
        </div>
        <PageDiscussionSection pageKey="help" />
      </section>
    </PageCard>
  );
}
