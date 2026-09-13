import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/Card";
import PageCard from "@/components/ui/PageCard";

type TermsPageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata = {
  title: "Terms of Service — Hello SG",
};

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const isMy = locale === "my";

  return (
    <PageCard>
      <section className="mx-auto w-full max-w-2xl space-y-8 py-4">
        <PageHeader
          title={isMy ? "ဝန်ဆောင်မှုသတ်မှတ်ချက်များ" : "Terms of Service"}
          subtitle={
            isMy
              ? "နောက်ဆုံးပြင်ဆင်သည့်ရက် — ၂၀၂၆ ခုနှစ်၊ စက်တင်ဘာ ၁၀"
              : "Last updated — 10 September 2026"
          }
        />

        <p className="text-ink-muted">
          {isMy
            ? "Hello SG ကို အသုံးပြုခြင်းဖြင့် ဤသတ်မှတ်ချက်များကို လက်ခံသည်ဟု မှတ်ယူသည်။ မသဘောတူပါက app ကို အသုံးမပြုပါနှင့်။"
            : "By using Hello SG you agree to these terms. If you do not agree, please stop using the app."}
        </p>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            {isMy
              ? "၁. သတင်းအချက်အလက် ကိရိယာ — သတိပေးချက်"
              : "1. Informational Tool — Disclaimer"}
          </h3>
          <p className="text-ink-muted">
            {isMy
              ? "Hello SG သည် စင်္ကာပူတွင် နေထိုင်သူများအတွက် သတင်း၊ လမ်းညွှန်နှင့် ကိရိယာများ ပေးသည် (ပတ်စပို့၊ သွားလာရေး၊ ယာဉ်မောင်းလိုင်စင်၊ လစာမှတ်တမ်း စသည်)။ Legal advice မဟုတ်ပါ။ အစိုးရ / သံရုံး / Traffic Police / LTA / MOM စည်းမျဉ်းများကို အမြဲ တရားဝင် ရင်းမြစ်တွင် အတည်ပြုပါ။"
              : "Hello SG provides news, guides and tools for people in Singapore (passport help, transport, driving licence, salary log, and more). It is not legal advice. Always verify government, embassy, Traffic Police, LTA, MOM and similar rules on official sources."}
          </p>
          <p className="text-sm text-ink-muted">
            {isMy
              ? "သင်ဖြည့်သော ဖောင် / မှတ်တမ်းများ၏ တိကျမှုကို သင်ကိုယ်တိုင် တာဝန်ယူရမည်။"
              : "You are responsible for the accuracy of any form or log data you enter."}
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            {isMy ? "၂. ကုန်ကျစရိတ်နှင့် ကြော်ငြာ" : "2. Cost & Advertising"}
          </h3>
          <ul className="list-disc space-y-2 pl-5 text-ink-muted">
            <li>
              {isMy
                ? "အလုပ်သမားများအတွက် အဓိက feature များ (လမ်းညွှန်၊ PDF export အပါအဝင်) ကို အခမဲ့ ပေးရန် ရည်ရွယ်သည်။"
                : "Core worker-facing features (including guides and PDF export) are intended to be free."}
            </li>
            <li>
              {isMy
                ? "App ကို အခမဲ့ ထားနိုင်ရန် sponsored banners နှင့်/သို့မဟုတ် Google AdSense သုံးနိုင်သည်။"
                : "We may show sponsored banners and/or Google AdSense so the app can stay free."}
            </li>
            <li>
              {isMy
                ? "အချို့ စီးပွားရေး/admin လုပ်ငန်းစဉ်များ (ဥပမာ sponsorship၊ manual payment အတည်ပြုမှု) အတွက် ငွေပေးချေမှု မှတ်တမ်း ရှိနိုင်သည် — အလုပ်သမား လမ်းညွှန်များ သုံးရန် မဖြစ်မနေ ပေးရန် မလိုအပ်ပါ။"
                : "Some business or admin flows (e.g. sponsorship or manual payment review) may involve payment records — they are not required to read free guides."}
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            {isMy ? "၃. Community မှတ်ချက်များ" : "3. Community Comments"}
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-ink-muted">
            <li>
              {isMy
                ? "မှတ်ချက် / reply / report လုပ်ရန် အကောင့်ဝင်ရန် လိုအပ်နိုင်သည်။"
                : "Posting, replying or reporting may require a logged-in account."}
            </li>
            <li>
              {isMy
                ? "မုန်းတီးမှု၊ စော်ကားမှု၊ spam၊ ဥပဒေချိုးဖောက်သော အကြောင်းအရာ မတင်ရ။"
                : "Do not post hate, harassment, spam or illegal content."}
            </li>
            <li>
              {isMy
                ? "Admin က မှတ်ချက်များကို ဖျက်/ဖုံးကွယ်နိုင်ပြီး report များကို စိစစ်နိုင်သည်။"
                : "Admins may hide or remove comments and review reports."}
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            {isMy
              ? "၄. Driving helpers နှင့် ပြင်ပ လင့်ခ်များ"
              : "4. Driving Helpers & External Links"}
          </h3>
          <p className="text-ink-muted">
            {isMy
              ? "ယာဉ်မောင်းလိုင်စင် စာမျက်နှာရှိ “အခမဲ့ မြန်မာ helper” များသည် community / စေတနာ့ဝန်ထမ်း အချက်အလက် ဖြစ်နိုင်သည် — Traffic Police သို့မဟုတ် LTA မဟုတ်ပါ။ သူတို့၏ Facebook / Telegram / WhatsApp / group လင့်ခ်များသည် ပြင်ပ site များဖြစ်သည်။ ငွေအများကြီး တောင်းပြီး လိုင်စင် “အာမခံ” ပေးမည်ဟု ဆိုသူများကို မယုံပါနှင့်။"
              : 'Community “free Myanmar helpers” on the driving-licence page are not Traffic Police or LTA. Their Facebook, Telegram, WhatsApp or group links lead to third-party sites. Do not pay large fees to anyone who “guarantees” a licence.'}
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            {isMy ? "၅. တားမြစ်ထားသောအသုံးပြုမှုများ" : "5. Prohibited Use"}
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-ink-muted">
            <li>
              {isMy
                ? "မှားယွင်းသော သို့မဟုတ် အတုအပ passport / visa / အလုပ် အချက်အလက် တင်ရန်"
                : "Submit false or fraudulent passport, visa or work information."}
            </li>
            <li>
              {isMy
                ? "အခြားသူ၏အကောင့်ကို ခွင့်မရဘဲ ဝင်ရန်"
                : "Access another user’s account without authorisation."}
            </li>
            <li>
              {isMy
                ? "Scraping၊ bots သို့မဟုတ် service ကို ထိခိုက်စေသော နည်းလမ်းများ"
                : "Use scraping, bots or any method that disrupts the service."}
            </li>
            <li>
              {isMy
                ? "စင်္ကာပူ သို့မဟုတ် သက်ဆိုင်ရာ ဥပဒေကို ချိုးဖောက်ရန် app ကို သုံးရန်"
                : "Use the app for any purpose that violates applicable law."}
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            {isMy ? "၆. အာမမခံချက်" : "6. No Guarantee"}
          </h3>
          <div className="rounded-2xl border border-warning-border bg-warning-soft p-4 text-sm text-warning">
            <p>
              {isMy
                ? "App ကို \"ရှိသည့်အတိုင်း\" (as-is) ပေးသည်။ အချိန်တိုင်း ရရှိမည်၊ error မရှိ၊ သို့မဟုတ် သင့်လျှောက်လွှာ/စာမေး/လိုင်စင် အောင်မည်ဟု အာမမခံပါ။ သံရုံး၊ Traffic Police၊ LTA၊ MOM စသည့် ဆုံးဖြတ်ချက်များသည် ကျွန်ုပ်တို့အပေါ် မကျရောက်ပါ။"
                : 'The app is provided "as is". We do not guarantee uninterrupted availability, error-free content, or success of any application, test or licence. Decisions by embassies, Traffic Police, LTA, MOM and similar bodies rest with them alone.'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">
            {isMy ? "၇. ပြောင်းလဲမှုများ" : "7. Changes to These Terms"}
          </h3>
          <p className="text-ink-muted">
            {isMy
              ? "ဤသတ်မှတ်ချက်များကို မည်သည့်အချိန်မဆို ပြောင်းနိုင်သည်။ ဤစာမျက်နှာတွင် တင်ပြီးမှ အကျိုးသက်ရောက်သည်။ ဆက်သုံးပါက သတ်မှတ်ချက်အသစ်ကို လက်ခံသည်ဟု မှတ်ယူသည်။"
              : "We may update these terms at any time. Changes take effect when posted on this page. Continued use means you accept the updated terms."}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface-muted p-4">
          <p className="text-sm text-ink-muted">
            {isMy ? "မေးခွန်းများအတွက် —" : "Questions about these terms —"}{" "}
            <span className="font-medium text-ink">hellosgmm@gmail.com</span>
          </p>
        </div>
      </section>
    </PageCard>
  );
}
