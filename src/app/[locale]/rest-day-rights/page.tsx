import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { PageHeader, Card } from "@/components/ui/Card";
import { routing } from "@/i18n/routing";

const FACT_KEYS = ["oneRestDay", "mandatoryOneDay", "compensation", "penalty"] as const;

export default async function RestDayRightsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations("restDay");

  return (
    <section className="space-y-5">
      <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

      <Card>
        <ul className="space-y-4">
          {FACT_KEYS.map((key, index) => (
            <li key={key} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
                {index + 1}
              </span>
              <span className="text-ink">{t(`facts.${key}`)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-3 border-danger-border bg-danger-soft">
        <h3 className="font-semibold text-danger">{t("reportTitle")}</h3>
        <p className="text-sm text-ink-muted">{t("reportSubtitle")}</p>
        <a
          href="tel:+6518003395505"
          className="flex items-center justify-between rounded-xl border border-danger-border bg-surface p-3"
        >
          <span className="font-medium text-ink">{t("reportHelplineName")}</span>
          <span className="font-bold text-danger">1800 339 5505</span>
        </a>
        <p className="text-xs text-ink-subtle">{t("reportHours")}</p>
      </Card>

      <p className="text-xs text-ink-subtle">{t("sourceDisclaimer")}</p>
    </section>
  );
}
