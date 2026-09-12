import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { PageHeader, Card } from "@/components/ui/Card";
import { routing } from "@/i18n/routing";
import PageCard from "@/components/ui/PageCard";
import StatusMessage from "@/components/ui/StatusMessage";
import LotteryWorkbench from "@/components/LotteryWorkbench";
import { getLotteryResults, LOTTERY_LINKS } from "@/lib/lottery";
import PageDiscussionSection from "@/components/PageDiscussionSection";

const EXTERNAL =
  "font-semibold text-brand-strong underline underline-offset-2";

export default async function LotteryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations("lottery");
  const results = await getLotteryResults();

  return (
    <PageCard>
      <section className="space-y-8">
        <PageHeader
          eyebrow={t("badge")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <StatusMessage variant="warning">{t("legalNotice")}</StatusMessage>
        <StatusMessage variant="error">{t("illegalAppsNotice")}</StatusMessage>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("toolsTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("toolsIntro")}</p>
          <LotteryWorkbench
            fourDDraws={results.fourD}
            totoDraws={results.toto}
            resultsError={results.error}
          />
        </Card>

        <StatusMessage variant="info">{t("ageNotice")}</StatusMessage>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("legalTitle")}</h3>
          <ul className="list-disc space-y-2 pl-5 text-sm text-ink">
            <li>{t("legalPointOfficial")}</li>
            <li>{t("legalPointOtherApps")}</li>
            <li>{t("legalPointNoPayout")}</li>
            <li>{t("legalPointPenalty")}</li>
          </ul>
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("playTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("playBody")}</p>
          <ul className="space-y-2 text-sm text-ink">
            <li>
              <a
                href={LOTTERY_LINKS.home}
                target="_blank"
                rel="noopener noreferrer"
                className={EXTERNAL}
              >
                {t("linkPlayOnline")}
              </a>
            </li>
            <li>
              <a
                href={LOTTERY_LINKS.officialApp}
                target="_blank"
                rel="noopener noreferrer"
                className={EXTERNAL}
              >
                {t("linkOfficialApp")}
              </a>
            </li>
            <li>
              <a
                href={LOTTERY_LINKS.outlets}
                target="_blank"
                rel="noopener noreferrer"
                className={EXTERNAL}
              >
                {t("linkOutlets")}
              </a>
            </li>
          </ul>
        </Card>

        <Card className="space-y-2">
          <h3 className="font-semibold text-ink">{t("responsibleTitle")}</h3>
          <p className="text-sm text-ink-muted">{t("responsibleBody")}</p>
          <a
            href={LOTTERY_LINKS.responsiblePlay}
            target="_blank"
            rel="noopener noreferrer"
            className={EXTERNAL}
          >
            {t("linkNcpg")}
          </a>
        </Card>
        <PageDiscussionSection pageKey="lottery" />
      </section>
    </PageCard>
  );
}
