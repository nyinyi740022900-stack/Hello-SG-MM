import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/Card";

type TermsPageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata = {
  title: "Terms of Service — SG Migrant Worker App",
};

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const isMy = locale === "my";

  return (
    <section className="mx-auto w-full max-w-2xl space-y-8 py-4">
      {/* ── Title ── */}
      <PageHeader
        title={isMy ? "ဝန်ဆောင်မှုသတ်မှတ်ချက်များ" : "Terms of Service"}
        subtitle={
          isMy
            ? "နောက်ဆုံးပြင်ဆင်သည့်ရက် — ၂၀၂၆ ခုနှစ်၊ စက်တင်ဘာ"
            : "Last updated — September 2026"
        }
      />

      {/* ── Intro ── */}
      <p className="text-ink-muted">
        {isMy
          ? "SG Migrant Worker App ကို အသုံးပြုခြင်းဖြင့် ဤသတ်မှတ်ချက်များကို လက်ခံသည်ဟု မှတ်ယူသည်။ မသဘောတူပါက ကျေးဇူးပြု၍ app ကို အသုံးမပြုပါနှင့်။"
          : "By using SG Migrant Worker App you agree to these terms. If you do not agree, please stop using the app."}
      </p>

      {/* ── 1. Informational Tool ── */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          {isMy
            ? "၁. သတင်းအချက်အလက် ကိရိယာ သတိပေးချက်"
            : "1. Informational Tool — Disclaimer"}
        </h3>
        <p className="text-ink-muted">
          {isMy
            ? "ဤ app သည် Myanmar migrant workers များ Singapore တွင် ပတ်စပို့ ပြန်လည်လျှောက်ရာတွင် လမ်းညွှန်ရန် ရည်ရွယ်သော ကိရိယာဖြစ်သည်။ ၎င်းသည် legal advice မဟုတ်ပါ — embassy တောင်းဆိုချက်များ သို့မဟုတ် government ဝန်ဆောင်မှုများ အတွက် အာမမခံပါ။"
            : "This app is an informational tool to help Myanmar migrant workers in Singapore navigate passport renewal. It is not legal advice. We do not guarantee the completeness or accuracy of information about embassy requirements or government services — always verify with the Myanmar Embassy Singapore directly."}
        </p>
        <p className="text-sm text-ink-muted">
          {isMy
            ? "App တွင်ဖြည့်သော ဖောင် draft များ၏ တိကျမှန်ကန်မှုနှင့် ပြည်ပြည်စုံမှုကို သင်ကိုယ်တိုင် တာဝန်ယူရမည်။"
            : "You are responsible for the accuracy and completeness of any form data you enter. Review the generated PDF carefully before submitting to the embassy."}
        </p>
      </div>

      {/* ── 2. Payment & Refunds ── */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          {isMy
            ? "၂. ငွေပေးချေမှုနှင့် ငွေပြန်အမ်းခြင်း"
            : "2. Payment & Refunds"}
        </h3>
        <ul className="list-disc space-y-2 pl-5 text-ink-muted">
          <li>
            {isMy
              ? "PDF export feature သည် one-time ငွေပေးချေမှု လိုအပ်သည့် premium feature ဖြစ်သည်။"
              : "The PDF export is a one-time premium feature purchase."}
          </li>
          <li>
            {isMy
              ? "လက်ရှိ version တွင် manual payment (KBZPay/WavePay) ဖြင့်သာ ငွေပေးချေနိုင်သည်။"
              : "In the current release, payment is accepted via manual payment proof (KBZPay/WavePay)."}
          </li>
          <li>
            {isMy
              ? "Manual payment အတည်ပြုရန် working day ၁–၂ ကြာနိုင်သည်။ Admin မှ receipt ကို စစ်ဆေးမှသာ feature ကို ဖွင့်ပေးမည်။"
              : "Manual payments are reviewed within 1–2 working days. Features are unlocked once an admin confirms your receipt."}
          </li>
          <li>
            {isMy
              ? "ငွေပြန်အမ်းပါက feature ကို သုံးမပြုမီနှင့် technical problem ဖြစ်ပါကသာ စစ်ဆေးပေးမည်။ ငွေပြန်အမ်းရန် support@sgmigrantworkerapp.com သို့ ဆက်သွယ်ပါ — ၇ ရက်အတွင်း ပြန်ကြားမည်။"
              : "Refund requests are considered if you have not yet used the premium feature or in the event of a technical failure. Contact support@sgmigrantworkerapp.com within 7 days of purchase for a review."}
          </li>
          <li>
            {isMy
              ? "ကတ်ငွေပေးချေမှု (card payment) ကို လက်ရှိတွင်မထည့်သွင်းရသေးပါ။"
              : "Card payment is not enabled in the current version."}
          </li>
        </ul>
      </div>

      {/* ── 3. Prohibited Use ── */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          {isMy ? "၃. တားမြစ်ထားသောအသုံးပြုမှုများ" : "3. Prohibited Use"}
        </h3>
        <p className="text-ink-muted">
          {isMy
            ? "ဤ app ကို အောက်ပါရည်ရွယ်ချက်များဖြင့် အသုံးမပြုပါနှင့် —"
            : "You must not use this app to —"}
        </p>
        <ul className="list-disc space-y-1 pl-5 text-ink-muted">
          <li>
            {isMy
              ? "မှားယွင်းသောသို့မဟုတ် အတုအပ passport / visa အချက်အလက်ဖြည့်ရန်"
              : "Submit false or fraudulent passport or visa information."}
          </li>
          <li>
            {isMy
              ? "အခြားသူ၏အကောင့်ကို ခွင့်မရဘဲ ဝင်ရောက်ကြည့်ရှုရန်"
              : "Access another user's account without authorisation."}
          </li>
          <li>
            {isMy
              ? "Scraping, bots, သို့မဟုတ် service ကို ပျက်စီးစေနိုင်သည့် နည်းလမ်းများ အသုံးပြုရန်"
              : "Use automated scraping, bots, or any method that could disrupt or harm the service."}
          </li>
          <li>
            {isMy
              ? "Singapore သို့မဟုတ် Myanmar ဥပဒေကို ချိုးဖောက်သည့် ကိစ္စများအတွက် app ကို အသုံးပြုရန်"
              : "Use the app for any purpose that violates Singapore or Myanmar law."}
          </li>
        </ul>
      </div>

      {/* ── 4. No Guarantee ── */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          {isMy ? "၄. အာမမခံချက်" : "4. No Guarantee"}
        </h3>
        <div className="rounded-2xl border border-warning-border bg-warning-soft p-4 text-sm text-warning">
          <p>
            {isMy
              ? "App ကို \"ရှိသည့်အတိုင်း\" (as-is) ပေးသည်။ ၎င်းသည် အချိန်တိုင်း ရရှိနိုင်မည်ဟု၊ error မရှိဟု၊ သင်၏ passport application ကို အောင်မြင်မည်ဟု မည်သည့်အာမခံမှ မပေးနိုင်ပါ။ embassy ၏ ဆုံးဖြတ်ချက်တာဝန်သည် ကျွန်ုပ်တို့အပေါ် မကျရောက်ပါ။"
              : 'The app is provided "as is". We make no guarantee that it will be available at all times, free of errors, or that your passport application will succeed. Approval decisions rest solely with the Myanmar Embassy Singapore. We are not liable for any loss or delay arising from use of this app.'}
          </p>
        </div>
      </div>

      {/* ── 5. Changes ── */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          {isMy ? "၅. ပြောင်းလဲမှုများ" : "5. Changes to These Terms"}
        </h3>
        <p className="text-ink-muted">
          {isMy
            ? "ဤသတ်မှတ်ချက်များကို မည်သည့်အချိန်မဆို ပြောင်းလဲနိုင်သည်။ ပြောင်းလဲမှုများသည် ဤစာမျက်နှာတွင် ကြေငြာချိန်မှ စတင်အကျိုးသက်ရောက်မည်။ ဆက်လက်အသုံးပြုပါကုန်ဆိုပါကသတ်မှတ်ချက်အသစ်ကိုလက်ခံသည်ဟု မှတ်ယူမည်။"
            : "We may update these terms at any time. Changes take effect when posted on this page. Continued use of the app after changes means you accept the updated terms."}
        </p>
      </div>

      {/* ── Contact ── */}
      <div className="rounded-2xl border border-border bg-surface-muted p-4">
        <p className="text-sm text-ink-muted">
          {isMy
            ? "မေးခွန်းများအတွက် ဆက်သွယ်ရန် —"
            : "Questions about these terms —"}{" "}
          <span className="font-medium">support@sgmigrantworkerapp.com</span>
        </p>
      </div>
    </section>
  );
}
