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
      q: "What tools does the app have besides news?",
      a: "The home page shortcuts and the menu (tap ☰) cover: Off-Day Guide, Salary Log, Rest Day Rights, Recruitment Fee Tracker, Emergency Contacts, Directory (free help services), Housing and Jobs listings, Travel guide, Driving Licence guide, Essential Accounts guide, Lottery result checker, Myanmar Radio, and live exchange rates. Tap More in the shortcuts row, or the menu icon, to see everything.",
    },
    {
      q: "Can I post a job or a room for rent?",
      a: "Yes. Open Jobs or Housing from the menu and use Post a job / Post a room. Job postings must be genuine — no fees requested from applicants, and no fake or scam listings. My jobs & applicants (under Jobs) shows what you've posted or applied to.",
    },
    {
      q: "What languages can I read the app in?",
      a: "English, Myanmar, Chinese, Tamil, Bengali and Malay — change it anytime with the language switcher next to the menu icon. English and Myanmar have the most complete translation; other languages fall back to English for anything not yet translated.",
    },
    {
      q: "Where do I see today's exchange rates?",
      a: "The home page shows live SGD rates for Myanmar, India, China, Bangladesh and Malaysia. These are indicative only — always confirm the exact rate in your remittance provider's own app before sending money.",
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
      q: "News အပြင် app ထဲမှာ ဘာတွေ ရှိသေးလဲ?",
      a: "ပင်မစာမျက်နှာရဲ့ shortcut တန်းနှင့် menu (☰) ထဲမှာ — Off-Day Guide၊ Salary Log၊ Rest Day Rights၊ Recruitment Fee Tracker၊ Emergency Contacts၊ Directory (အခမဲ့ အကူအညီဌာနများ)၊ အိမ်ရာနှင့် အလုပ်အကိုင် ကြော်ငြာများ၊ Travel guide၊ Driving Licence guide၊ Essential Accounts guide၊ Lottery ရလဒ်စစ်ဆေးခြင်း၊ Myanmar Radio နှင့် ငွေလဲနှုန်း (live) တို့ ပါဝင်ပါသည်။ Shortcut တန်းရဲ့ More ကို (သို့) menu icon ကို နှိပ်ပြီး အားလုံးကို ကြည့်နိုင်ပါသည်။",
    },
    {
      q: "အလုပ် (သို့) အိမ်ငှား ကြော်ငြာ တင်လို့ရလား?",
      a: "ရပါတယ်။ Menu ထဲက Jobs (သို့) Housing ကို ဖွင့်ပြီး Post a job / Post a room ကို သုံးပါ။ အလုပ်ကြော်ငြာများသည် တကယ့် အလုပ်အမှန် ဖြစ်ရပါမည် — လျှောက်ထားသူထံမှ ကြေးမတောင်းရပါ၊ အတု (သို့) လိမ်လည် ကြော်ငြာများ ခွင့်မပြုပါ။ Jobs ထဲက 'My jobs & applicants' တွင် ကိုယ်တင်ထားသော (သို့) လျှောက်ထားသော ကြော်ငြာများကို ကြည့်နိုင်ပါသည်။",
    },
    {
      q: "App ကို ဘာဘာသာစကားတွေနဲ့ ဖတ်လို့ရလဲ?",
      a: "English၊ မြန်မာ၊ တရုတ်၊ တမီလ်၊ ဘင်္ဂါလီနှင့် မလေး — menu icon ဘေးက language switcher ဖြင့် အချိန်မရွေး ပြောင်းလို့ရပါသည်။ English နှင့် မြန်မာက အပြည့်စုံဆုံး ဘာသာပြန်ထားပြီး၊ ကျန်ဘာသာစကားများတွင် ဘာသာမပြန်ရသေးသော အပိုင်းများကို English ဖြင့် ပြပါမည်။",
    },
    {
      q: "ဒီနေ့ ငွေလဲနှုန်းကို ဘယ်မှာ ကြည့်ရမလဲ?",
      a: "ပင်မစာမျက်နှာတွင် မြန်မာ၊ အိန္ဒိယ၊ တရုတ်၊ ဘင်္ဂလားဒေ့ရှ်နှင့် မလေးရှားအတွက် SGD ငွေလဲနှုန်း (live) ကို ပြသထားပါသည်။ ဒါက ခန့်မှန်းချက်သာ ဖြစ်ပါသည် — ငွေမပို့မီ သင့်ဝန်ဆောင်မှုပေးသူ (remittance provider) ၏ app ထဲက တကယ့်နှုန်းကို အမြဲ အတည်ပြုပါ။",
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
