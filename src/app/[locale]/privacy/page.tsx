import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/Card";
import PageCard from "@/components/ui/PageCard";

type PrivacyPageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata = {
  title: "Privacy Policy — Hello SG",
};

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const isMy = locale === "my";

  return (
    <PageCard>
      <section className="mx-auto w-full max-w-2xl space-y-8 py-4">
        <PageHeader
          title={isMy ? "ကိုယ်ရေးအချက်အလက် မူဝါဒ" : "Privacy Policy"}
          subtitle={
            isMy
              ? "နောက်ဆုံးပြင်ဆင်သည့်ရက် — ၂၀၂၆ ခုနှစ်၊ စက်တင်ဘာ ၁၀"
              : "Last updated — 10 September 2026"
          }
        />

        <p className="text-ink-muted">
          {isMy
            ? "Hello SG (\"ကျွန်ုပ်တို့\") သည် စင်္ကာပူတွင် နေထိုင်သူများအတွက် သတင်း၊ လမ်းညွှန်နှင့် ကိရိယာများ ပေးသည့် ဝန်ဆောင်မှုဖြစ်သည်။ ဤမူဝါဒသည် ကျွန်ုပ်တို့ ဘာသိမ်းဆည်းသည်၊ ဘာကြောင့် သိမ်းဆည်းသည်နှင့် သင်မည်သို့ ထိန်းချုပ်နိုင်ကြောင်း ရှင်းပြသည်။"
            : 'Hello SG ("we", "our") provides news, guides and tools for people living in Singapore. This policy explains what data we collect, why we collect it, and how you control it.'}
        </p>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            {isMy ? "၁. သိမ်းဆည်းသောအချက်အလက်များ" : "1. Data We Collect"}
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-ink-muted">
            <li>
              <strong>{isMy ? "အကောင့်" : "Account"}</strong>
              {" — "}
              {isMy
                ? "Supabase Auth မှတဆင့် email နှင့် hashed password။ plain-text password ကို မသိမ်းပါ။"
                : "Email and hashed password via Supabase Auth. We never store your plain-text password."}
            </li>
            <li>
              <strong>{isMy ? "ပရိုဖိုင် ဦးစားပေးများ" : "Profile preferences"}</strong>
              {" — "}
              {isMy
                ? "ဘာသာစကား၊ ရွေးချယ်ထားသော နိုင်ငံ/အသိုင်းအဝိုင်း၊ theme စသည့် ဦးစားပေးများ (ရှိပါက)။"
                : "Language, selected country/community preference, and theme settings when you set them."}
            </li>
            <li>
              <strong>{isMy ? "ဖောင် draft များ" : "Form drafts"}</strong>
              {" — "}
              {isMy
                ? "Passport wizard တွင် ဖြည့်သော အချက်အလက်များ (နာမည်၊ ပတ်စပို့ နံပါတ် စသည်) ကို အကောင့်နှင့် ချိတ်ဆက် သိမ်းနိုင်သည်။"
                : "Passport wizard field values (name, passport number, etc.) saved to your account so you can return later."}
            </li>
            <li>
              <strong>{isMy ? "လစာ / အေဂျင့်ကြေး မှတ်တမ်း" : "Salary & fee logs"}</strong>
              {" — "}
              {isMy
                ? "သင် ထည့်သွင်းသော လစာ သို့မဟုတ် အေဂျင့်ကြေး မှတ်တမ်းများနှင့် PDF export အတွက် လိုအပ်သော အချက်အလက်။"
                : "Salary or recruitment-fee entries you create, and data needed to export a PDF report."}
            </li>
            <li>
              <strong>{isMy ? "မှတ်ချက်နှင့် report" : "Comments & reports"}</strong>
              {" — "}
              {isMy
                ? "လမ်းညွှန်စာမျက်နှာများနှင့် place comments တွင် သင်ရေးသော စာသား၊ reply များ၊ နှင့် မသင့်လျော်သော အကြောင်းအရာ report များ (login လိုအပ်)။"
                : "Text you post on guide/tool pages or place comments, replies, and reports of inappropriate content (login required)."}
            </li>
            <li>
              <strong>{isMy ? "ငွေပေးချေမှု" : "Payments"}</strong>
              {" — "}
              {isMy
                ? "ငွေပေးချေမှု မှတ်တမ်း (ပမာဏ၊ အခြေအနေ) နှင့် manual payment (KPay/WavePay) အတွက် upload လုပ်သော ပြေစာပုံများ။"
                : "Payment records (amount, status) and receipt images you upload for manual payment (e.g. KPay/WavePay)."}
            </li>
            <li>
              <strong>{isMy ? "ကြော်ငြာ တိုင်းတာမှု" : "Ad measurement"}</strong>
              {" — "}
              {isMy
                ? "Sponsored banner များအတွက် impression / click event များ (user id ရှိပါက ချိတ်ဆက်နိုင်)။ Google AdSense က သီးခြား cookie / identifier သုံးနိုင်သည်။"
                : "Impression and click events for sponsored banners (may be linked to your user id if logged in). Google AdSense may use its own cookies or identifiers."}
            </li>
            <li>
              <strong>{isMy ? "Analytics" : "Analytics"}</strong>
              {" — "}
              {isMy
                ? "Feature အသုံးပြုမှုကို ခြေရာခံသော anonymous (သို့) အကောင့်နှင့် ချိတ်ဆက်ထားသော event log များ — app တိုးတက်အောင် ကူညီရန်။"
                : "Usage events to improve the product (some anonymous; some tied to your account when logged in)."}
            </li>
            <li>
              <strong>{isMy ? "Contact / sponsorship" : "Contact / sponsorship"}</strong>
              {" — "}
              {isMy
                ? "Contact ဖောင်မှ ပို့သော စာသားနှင့် ဆက်သွယ်ရန် အချက်အလက်။"
                : "Messages and contact details you submit through the Contact / sponsorship form."}
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            {isMy
              ? "၂. အချက်အလက်များကို မည်သို့ အသုံးပြုသည်"
              : "2. How We Use Your Data"}
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-ink-muted">
            <li>
              {isMy
                ? "လမ်းညွှန်များ၊ ကိရိယာများ၊ ဖောင် draft နှင့် သတိပေးချက်များ ပေးရန်"
                : "Provide guides, tools, saved drafts and reminders."}
            </li>
            <li>
              {isMy
                ? "Community comments ကို ပြသရန်နှင့် မသင့်လျော်သော အကြောင်းအရာကို စိစစ်ရန်"
                : "Show community comments and moderate reported content."}
            </li>
            <li>
              {isMy
                ? "App ကို အခမဲ့ ထားနိုင်ရန် sponsored ads / AdSense ကို ပြသပြီး တိုင်းတာရန်"
                : "Show and measure sponsored ads / AdSense so the app can stay free."}
            </li>
            <li>
              {isMy
                ? "Support၊ sponsorship inquiry နှင့် account ဖျက်ရန် တောင်းဆိုမှုများကို ဖြေကြားရန်"
                : "Respond to support, sponsorship inquiries and deletion requests."}
            </li>
            <li>
              {isMy
                ? "App အရည်အသွေး တိုးတက်အောင် usage ပုံစံများကို ခွဲခြမ်းစိတ်ဖြာရန်"
                : "Analyse usage patterns to improve the product."}
            </li>
          </ul>
          <p className="text-sm text-ink-muted">
            {isMy
              ? "ကျွန်ုပ်တို့သည် သင်၏ဒေတာကို ကြော်ငြာသူများထံ မရောင်းချပါ။ Sponsored helper / partner လင့်ခ်များကို နှိပ်ပါက သက်ဆိုင်ရာ site သို့ သွားမည်။"
              : "We do not sell your personal data. If you open a sponsored or community-helper link, you leave our site for that third party."}
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            {isMy ? "၃. သိမ်းဆည်းခြင်းနှင့် လုံခြုံရေး" : "3. Storage & Security"}
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-ink-muted">
            <li>
              {isMy
                ? "ဒေတာများကို Supabase (PostgreSQL) တွင် သိမ်းသည် — AWS ap-southeast-1 (Singapore) တွင် host လုပ်သည်။"
                : "Data is stored in Supabase (PostgreSQL) hosted on AWS ap-southeast-1 (Singapore)."}
            </li>
            <li>
              {isMy
                ? "ငွေပေးချေမှု ပြေစာပုံများသည် private storage တွင် ရှိပြီး admin သာ ကြည့်နိုင်သည်။"
                : "Payment receipt images are in a private storage bucket — accessible only to admins."}
            </li>
            <li>
              {isMy
                ? "Sponsored ad ပုံများနှင့် driving helper ပုံများသည် public storage တွင် ရှိနိုင်သည် (admin က တင်သော ပုံများ)။"
                : "Sponsored-ad images and driving-helper photos may be stored in public buckets (uploaded by admins)."}
            </li>
            <li>
              {isMy
                ? "HTTPS နှင့် Supabase Row-Level Security ဖြင့် ကာကွယ်သည် — သင့်ကိုယ်ပိုင် မှတ်တမ်းများကိုသာ သင် ကြည့်/ပြင်နိုင်သည် (admin ကွဲပြား)။"
                : "Traffic uses HTTPS. Supabase Row-Level Security limits access to your own records (admins have separate access for moderation)."}
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            {isMy ? "၄. Third-party ဝန်ဆောင်မှုများ" : "4. Third-Party Services"}
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-ink-muted">
            <li>
              {isMy
                ? "Supabase — auth၊ database၊ storage"
                : "Supabase — authentication, database and storage."}
            </li>
            <li>
              {isMy
                ? "Google AdSense (ဖွင့်ထားပါက) — ကြော်ငြာ ပြသခြင်းနှင့် တိုင်းတာမှု"
                : "Google AdSense (when enabled) — ad delivery and measurement."}
            </li>
            <li>
              {isMy
                ? "Vercel — ဝက်ဘ် app host လုပ်ခြင်း"
                : "Vercel — hosting the web app."}
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            {isMy ? "၅. သင်၏အခွင့်အရေးများ" : "5. Your Rights"}
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-ink-muted">
            <li>
              <strong>{isMy ? "ကြည့်ရှုခြင်း" : "Access"}</strong>
              {" — "}
              {isMy
                ? "သိမ်းထားသော draft / မှတ်တမ်းများကို Account နှင့် သက်ဆိုင်ရာ ကိရိယာများမှ ကြည့်နိုင်သည်။"
                : "View saved drafts and tool data from Account and the relevant tools."}
            </li>
            <li>
              <strong>{isMy ? "ဖျက်သိမ်းခြင်း" : "Deletion"}</strong>
              {" — "}
              {isMy
              ? "အကောင့်နှင့် ဆက်နွှယ်ဒေတာ ဖျက်ရန် Account စာမျက်နှာရှိ Delete account ကို သုံးပါ သို့မဟုတ် အောက်ပါ email သို့ ဆက်သွယ်ပါ။"
              : "To delete your account and associated data, use Delete account on the Account page, or email us below."}
            </li>
            <li>
              <strong>{isMy ? "ထုတ်ယူခြင်း" : "Export"}</strong>
              {" — "}
              {isMy
                ? "လစာမှတ်တမ်းကို PDF အဖြစ် ထုတ်ယူနိုင်သည်။"
                : "Export your salary record as a PDF where that feature is available."}
            </li>
            <li>
              <strong>{isMy ? "မှတ်ချက်" : "Comments"}</strong>
              {" — "}
              {isMy
                ? "သင်ရေးသော မှတ်ချက်များကို admin က စိစစ်/ဖျက်နိုင်သည်။ မသင့်လျော်သော အကြောင်းအရာကို report လုပ်နိုင်သည်။"
                : "Admins may hide or remove comments. You can report inappropriate content."}
            </li>
          </ul>
        </div>

        <div className="space-y-2 rounded-2xl border border-border bg-surface-muted p-4">
          <h3 className="font-semibold">
            {isMy ? "ဆက်သွယ်ရန်" : "Contact Us"}
          </h3>
          <p className="text-sm text-ink-muted">
            {isMy
              ? "ကိုယ်ရေးအချက်အလက်ဆိုင်ရာ မေးခွန်းများ သို့မဟုတ် account ဖျက်ရန် —"
              : "For privacy questions or account deletion —"}
          </p>
          <p className="text-sm font-medium text-ink">
            support@sgmigrantworkerapp.com
          </p>
        </div>
      </section>
    </PageCard>
  );
}
