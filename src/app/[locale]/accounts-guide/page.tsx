import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { PageHeader, Card } from "@/components/ui/Card";
import StatusMessage from "@/components/ui/StatusMessage";
import { routing } from "@/i18n/routing";
import { BankIcon, TransferIcon, IdCardIcon, WalletIcon } from "@/components/icons";

const ACCOUNTS = [
  { key: "bank", icon: BankIcon, link: "https://www.mom.gov.sg" },
  { key: "paynow", icon: TransferIcon, link: null },
  { key: "singpass", icon: IdCardIcon, link: "https://www.singpass.gov.sg" },
  { key: "grabpay", icon: WalletIcon, link: "https://www.grab.com/sg/pay/" },
] as const;

export default async function AccountsGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const t = await getTranslations("accountsGuide");

  return (
    <section className="space-y-5">
      <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

      <StatusMessage variant="info">{t("bnplNote")}</StatusMessage>

      <div className="space-y-3">
        {ACCOUNTS.map(({ key, icon: Icon, link }) => (
          <Card key={key} className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="font-semibold text-ink">{t(`accounts.${key}.name`)}</h3>
            </div>
            <p className="text-sm text-ink-muted">
              <span className="font-medium text-ink">{t("whyLabel")}: </span>
              {t(`accounts.${key}.why`)}
            </p>
            <p className="text-sm text-ink-muted">
              <span className="font-medium text-ink">{t("howLabel")}: </span>
              {t(`accounts.${key}.how`)}
            </p>
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-xs font-medium text-brand-strong underline"
              >
                {t("officialLink")}
              </a>
            ) : null}
          </Card>
        ))}
      </div>

      <p className="text-xs text-ink-subtle">{t("disclaimer")}</p>
    </section>
  );
}
