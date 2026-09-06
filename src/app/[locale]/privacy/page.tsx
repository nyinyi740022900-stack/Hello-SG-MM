import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/Card";

type PrivacyPageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata = {
  title: "Privacy Policy — SG Migrant Worker App",
};

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const isMy = locale === "my";

  return (
    <section className="mx-auto w-full max-w-2xl space-y-8 py-4">
      {/* ── Title ── */}
      <PageHeader
        title={isMy ? "ကိုယ်ရေးအချက်အလက် မူဝါဒ" : "Privacy Policy"}
        subtitle={
          isMy
            ? "နောက်ဆုံးပြင်ဆင်သည့်ရက် — ၂၀၂၆ ခုနှစ်၊ စက်တင်ဘာ"
            : "Last updated — September 2026"
        }
      />

      {/* ── Intro ── */}
      <p className="text-ink-muted">
        {isMy
          ? "SG Migrant Worker App (\"ကျွန်ုပ်တို့\") သည် သင်၏ကိုယ်ရေးအချက်အလက်ကို အလေးထားသည်။ ဤမူဝါဒသည် ကျွန်ုပ်တို့ ဘာသိမ်းဆည်းသည်၊ ဘာကြောင့် သိမ်းဆည်းသည်နှင့် သင်မည်သို့ ထိန်းချုပ်နိုင်ကြောင်း ရှင်းပြသည်။"
          : 'SG Migrant Worker App ("we", "our") is built for Myanmar migrant workers in Singapore. This policy explains what data we collect, why we collect it, and how you control it.'}
      </p>

      {/* ── 1. Data Collected ── */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          {isMy ? "၁. သိမ်းဆည်းသောအချက်အလက်များ" : "1. Data We Collect"}
        </h3>
        <ul className="list-disc space-y-1 pl-5 text-ink-muted">
          <li>
            <strong>{isMy ? "အကောင့်" : "Account"}</strong>
            {" — "}
            {isMy
              ? "ကျွန်ုပ်တို့ Supabase Auth မှတဆင့် email လိပ်စာနှင့် hashed password တို့ကိုသာ သိမ်းဆည်းသည်။"
              : "Email address and hashed password stored via Supabase Auth. We never see your plain-text password."}
          </li>
          <li>
            <strong>{isMy ? "ဖောင် draft များ" : "Form drafts"}</strong>
            {" — "}
            {isMy
              ? "သင် wizard ဖောင်တွင် ဖြည့်သွင်းသောအချက်အလက်များ (နာမည်၊ ပတ်စပို့ နံပါတ်) ကို သင့်အကောင့်နှင့် ချိတ်ဆက်ပြီး database တွင် သိမ်းဆည်းသည်။"
              : "Form field values you enter in the passport wizard (name, passport number, etc.) are saved to your account so you can return later."}
          </li>
          <li>
            <strong>{isMy ? "ငွေပေးချေမှု" : "Payments"}</strong>
            {" — "}
            {isMy
              ? "ငွေပေးချေမှု မှတ်တမ်း (ပမာဏ၊ အခြေအနေ) နှင့် သင် upload လုပ်သော ငွေပေးချေမှု voucher ဓာတ်ပုံများ။ လက်ရှိတွင် manual payment (KBZPay/WavePay) ကိုသာ အသုံးပြုထားသည်။"
              : "Payment records (amount, status) and any receipt image you upload for manual payment. The current flow supports manual payment proof (KBZPay/WavePay)."}
          </li>
          <li>
            <strong>{isMy ? "Analytics" : "Analytics"}</strong>
            {" — "}
            {isMy
              ? "မည်သည့် feature ကို အသုံးပြုသည်ကို ခြေရာခံသော anonymous event log များ (e.g. \'wizard_opened\')။ ကိုယ်ရေးအချက်အလက် မပါဝင်ပါ။"
              : "Anonymous usage events (e.g. 'wizard_opened', 'payment_initiated') to help us improve the app. No personally identifiable data in analytics rows."}
          </li>
        </ul>
      </div>

      {/* ── 2. How We Use Data ── */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          {isMy
            ? "၂. အချက်အလက်များကို မည်သို့ အသုံးပြုသည်"
            : "2. How We Use Your Data"}
        </h3>
        <ul className="list-disc space-y-1 pl-5 text-ink-muted">
          <li>
            {isMy
              ? "ပတ်စပို့ ဖောင် draft ကို သိမ်းဆည်းပြီး PDF ထုတ်ပေးရန်"
              : "Save your passport-renewal form draft and generate the PDF export."}
          </li>
          <li>
            {isMy
              ? "Premium feature အတွက် ငွေပေးချေမှုကို အတည်ပြုရန်"
              : "Verify your payment to unlock premium features (PDF export)."}
          </li>
          <li>
            {isMy
              ? "App ကို ပိုကောင်းအောင် ပြုပြင်ရန် anonymous usage data ကို ခွဲခြမ်းစိတ်ဖြာရန်"
              : "Analyse anonymous usage patterns to improve the app."}
          </li>
          <li>
            {isMy
              ? "သင်ဆက်သွယ်ပါက technical support ပေးရန်"
              : "Respond to support requests when you contact us."}
          </li>
        </ul>
        <p className="text-sm text-ink-muted">
          {isMy
            ? "ကျွန်ုပ်တို့သည် သင်၏ဒေတာကို မည်သည့် third-party ကိုမျှ မရောင်းချပါ။"
            : "We do not sell your data to any third party."}
        </p>
      </div>

      {/* ── 3. Storage & Security ── */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          {isMy ? "၃. သိမ်းဆည်းခြင်းနှင့် လုံခြုံရေး" : "3. Storage & Security"}
        </h3>
        <ul className="list-disc space-y-1 pl-5 text-ink-muted">
          <li>
            {isMy
              ? "ဒေတာများကို Supabase (PostgreSQL) တွင် သိမ်းဆည်းသည် — AWS ap-southeast-1 (Singapore) server များပေါ်တွင် host လုပ်သည်။"
              : "Data is stored in Supabase (PostgreSQL) hosted on AWS ap-southeast-1 (Singapore)."}
          </li>
          <li>
            {isMy
              ? "ငွေပေးချေမှု voucher ဓာတ်ပုံများသည် private Supabase Storage bucket တွင် ရှိပြီး admin သာ ကြည့်ရှုနိုင်သည်။"
              : "Payment receipt images are in a private Supabase Storage bucket — accessible only to app admins."}
          </li>
          <li>
            {isMy
              ? "အကောင့်ဝင်ရောက်မှုကို HTTPS နှင့် Supabase RLS (Row-Level Security) ဖြင့် ကာကွယ်သည်။"
              : "All data is transferred over HTTPS. Supabase Row-Level Security ensures you can only access your own records."}
          </li>
          <li>
            {isMy
              ? "လက်ရှိထုတ်ပြန်မှုတွင် ကတ်ငွေပေးချေမှုကို မထည့်သွင်းရသေးပါ။"
              : "Card payments are not enabled in the current release."}
          </li>
        </ul>
      </div>

      {/* ── 4. Your Rights ── */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          {isMy ? "၄. သင်၏အခွင့်အရေးများ" : "4. Your Rights"}
        </h3>
        <ul className="list-disc space-y-1 pl-5 text-ink-muted">
          <li>
            <strong>{isMy ? "ကြည့်ရှုခြင်း" : "Access"}</strong>
            {" — "}
            {isMy
              ? "သင်သိမ်းဆည်းထားသော form draft ကို Account page မှ ကြည့်ရှုနိုင်သည်။"
              : "View your saved drafts from the Account page."}
          </li>
          <li>
            <strong>{isMy ? "ဖျက်သိမ်းခြင်း" : "Deletion"}</strong>
            {" — "}
            {isMy
              ? "Account နှင့် ၎င်းနှင့်ဆက်နွှယ်သောဒေတာများ ဖျက်ရန် ကျွန်ုပ်တို့ကို ဆက်သွယ်ပါ (အောက်ပါ email)။"
              : "To delete your account and all associated data, contact us at the email below."}
          </li>
          <li>
            <strong>{isMy ? "ထုတ်ယူခြင်း" : "Export"}</strong>
            {" — "}
            {isMy
              ? "သင်၏ passport form ကို PDF အဖြစ် ထုတ်ယူနိုင်သည် (premium feature)။"
              : "Export your form data as a PDF at any time (premium feature)."}
          </li>
        </ul>
      </div>

      {/* ── 5. Contact ── */}
      <div className="space-y-2 rounded-2xl border border-border bg-surface-muted p-4">
        <h3 className="font-semibold">
          {isMy ? "ဆက်သွယ်ရန်" : "Contact Us"}
        </h3>
        <p className="text-sm text-ink-muted">
          {isMy
            ? "ကိုယ်ရေးအချက်အလက်ဆိုင်ရာ မေးခွန်းများ သို့မဟုတ် account ဖျက်ရန် တောင်းဆိုမှုများအတွက် —"
            : "For privacy questions or account deletion requests —"}
        </p>
        <p className="text-sm font-medium text-ink">
          support@sgmigrantworkerapp.com{" "}
          <span className="font-normal text-ink-subtle">
            {isMy ? "(support mailbox)" : "(support mailbox)"}
          </span>
        </p>
      </div>
    </section>
  );
}
