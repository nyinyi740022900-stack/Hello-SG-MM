import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/Card";
import PageCard from "@/components/ui/PageCard";

type CookiesPageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata = {
  title: "Cookies Policy — Hello SG",
};

export default async function CookiesPage({ params }: CookiesPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const isMy = locale === "my";

  return (
    <PageCard>
      <section className="mx-auto w-full max-w-2xl space-y-5">
        <PageHeader
          title={isMy ? "Cookies မူဝါဒ" : "Cookies Policy"}
          subtitle={
            isMy
              ? "နောက်ဆုံးပြင်ဆင်သည့်ရက် — ၂၀၂၆ ခုနှစ်၊ စက်တင်ဘာ ၁၀။ Login၊ ဦးစားပေးများနှင့် ကြော်ငြာ/analytics အတွက် cookies သို့မဟုတ် local storage သုံးနိုင်သည်။"
              : "Last updated — 10 September 2026. We use cookies and similar storage for login, preferences, and optional ads/analytics."
          }
        />
        <ul className="list-disc space-y-2 pl-5 text-sm text-ink-muted">
          <li>
            <strong>{isMy ? "Essential" : "Essential"}</strong>
            {" — "}
            {isMy
              ? "လုံခြုံသော login session (Supabase Auth) ထားရှိရန် လိုအပ်သည်။"
              : "Required for secure login sessions (Supabase Auth)."}
          </li>
          <li>
            <strong>{isMy ? "Preferences" : "Preferences"}</strong>
            {" — "}
            {isMy
              ? "ရွေးချယ်ထားသော နိုင်ငံ/အသိုင်းအဝိုင်း သို့မဟုတ် UI ဦးစားပေးများကို မှတ်သားရန် cookie သို့မဟုတ် အလားတူ storage သုံးနိုင်သည်။"
              : "May remember your selected country/community or UI preferences via a cookie or similar storage."}
          </li>
          <li>
            <strong>{isMy ? "Performance / analytics" : "Performance / analytics"}</strong>
            {" — "}
            {isMy
              ? "App အသုံးပြုမှုကို စုပေါင်းနားလည်ပြီး စွမ်းဆောင်ရည် တိုးတက်အောင် ကူညီသည်။"
              : "Help us understand aggregate usage and improve performance."}
          </li>
          <li>
            <strong>{isMy ? "Advertising" : "Advertising"}</strong>
            {" — "}
            {isMy
              ? "Google AdSense (ဖွင့်ထားပါက) ကြော်ငြာ ပြသခြင်းနှင့် reporting အတွက် cookies သုံးနိုင်သည်။ Sponsored banner impression/click များကို ကျွန်ုပ်တို့ database တွင် မှတ်နိုင်သည်။"
              : "Google AdSense (when enabled) may set cookies for ad delivery and reporting. We may also log sponsored-banner impressions and clicks in our database."}
          </li>
        </ul>
        <p className="text-sm text-ink-muted">
          {isMy
            ? "Browser setting မှ cookies ကို ပိတ်နိုင်သော်လည်း login သို့မဟုတ် အချို့ feature များ အလုပ်မလုပ်နိုင်ပါ။ အသေးစိတ် — Privacy Policy။"
            : "You can block cookies in your browser settings, but login or some features may stop working. See also our Privacy Policy."}
        </p>
      </section>
    </PageCard>
  );
}
