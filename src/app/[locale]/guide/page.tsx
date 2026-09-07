import Script from "next/script";
import { getTranslations } from "next-intl/server";
import AdBanner from "@/components/AdBanner";
import GoogleAdSlot from "@/components/GoogleAdSlot";
import { PageHeader, Card } from "@/components/ui/Card";
import PageCard from "@/components/ui/PageCard";
import StatusMessage from "@/components/ui/StatusMessage";
import CountryMissionCard from "@/components/CountryMissionCard";
import { resolveSelectedCountry } from "@/lib/country.server";

const STEP_KEYS = ["checkExpiry", "gatherDocuments", "checkAppointment", "fillSample", "reviewBeforeSubmit"] as const;

export default async function PassportGuidePage() {
  const t = await getTranslations("guide");
  const tCountry = await getTranslations("country");
  const country = await resolveSelectedCountry();
  const adSenseClientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;
  const guideAdSlot = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_GUIDE_SLOT_ID;

  // These five steps were written from the Myanmar embassy's own guidance and
  // reference its forms and its tax receipt. Another country's process differs
  // at almost every step, so showing them under a Bangladeshi or Malaysian
  // reader's flag would be inventing a procedure we have never checked — the
  // same reason /passport/checklist and /passport/wizard are gated.
  if (!country.hasLocalPassportGuide) {
    return (
      <PageCard>
        <section className="space-y-5">
          <PageHeader eyebrow={t("badge")} title={t("title")} />
          <CountryMissionCard country={country} />
          <StatusMessage variant="info">
            <span className="block space-y-1">
              <span className="block font-medium">
                {tCountry("noGuideTitle", { country: country.englishName })}
              </span>
              <span className="block">{tCountry("noGuideBody")}</span>
            </span>
          </StatusMessage>
        </section>
      </PageCard>
    );
  }

  return (
    <PageCard>
      <section className="space-y-6">
        <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

        <Card>
          <ol className="space-y-4">
            {STEP_KEYS.map((key, index) => (
              <li key={key} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-ink-on-brand">
                  {index + 1}
                </span>
                <span className="text-ink">{t(`steps.${key}`)}</span>
              </li>
            ))}
          </ol>
        </Card>

        <AdBanner
          placement="guide_bottom"
          sponsorName={t("sponsorLabel")}
          headline={t("sponsorHeadline")}
          description={t("sponsorDescription")}
          ctaText={t("sponsorCta")}
          targetUrl="/owner/income"
        />

        {guideAdSlot ? (
          <>
            {adSenseClientId ? (
              <Script
                id="google-adsense-guide"
                async
                strategy="afterInteractive"
                src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseClientId}`}
                crossOrigin="anonymous"
              />
            ) : null}
            <GoogleAdSlot
              slot={guideAdSlot}
              className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
            />
          </>
        ) : null}
      </section>
    </PageCard>
  );
}
