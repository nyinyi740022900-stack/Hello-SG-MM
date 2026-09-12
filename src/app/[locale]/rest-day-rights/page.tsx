import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { PageHeader, Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { PhoneAlertIcon } from "@/components/icons";
import { routing } from "@/i18n/routing";
import PageCard from "@/components/ui/PageCard";
import {
  getEmergencyContact,
  whatsappUrl,
} from "@/lib/emergencyContacts";
import {
  IF_DENIED_KEYS,
  MDW_FACT_KEYS,
  MDW_FLEX_KEYS,
  MDW_PAY_EXAMPLE,
  REST_DAY_HELPLINE_IDS,
  REST_DAY_LINKS,
  WP_FACT_KEYS,
} from "@/lib/restDayRights";
import PageDiscussionSection from "@/components/PageDiscussionSection";

const EXTERNAL_LINK_CLASS = "font-semibold text-brand-strong underline";

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
  const tEmergency = await getTranslations("emergency");

  const orderedList = (keys: readonly string[], prefix: string) => (
    <ul className="space-y-3">
      {keys.map((key, index) => (
        <li key={key} className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
            {index + 1}
          </span>
          <span className="text-sm text-ink">{t(`${prefix}.${key}`)}</span>
        </li>
      ))}
    </ul>
  );

  const sectionHeading = (title: string, subtitle?: string) => (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-subtle">{title}</h3>
      {subtitle ? <p className="text-sm text-ink-muted">{subtitle}</p> : null}
    </div>
  );

  return (
    <PageCard>
      <section className="space-y-8">
        <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href="#mdw"
            className="rounded-2xl border border-brand-soft-border bg-brand-soft p-4 transition active:scale-[0.99]"
          >
            <p className="font-semibold text-ink">{t("jump.mdw")}</p>
            <p className="text-sm text-ink-muted">{t("jump.mdwHint")}</p>
          </a>
          <a
            href="#work-permit"
            className="rounded-2xl border border-border bg-surface p-4 transition hover:border-brand-soft-border hover:bg-brand-soft"
          >
            <p className="font-semibold text-ink">{t("jump.wp")}</p>
            <p className="text-sm text-ink-muted">{t("jump.wpHint")}</p>
          </a>
        </div>

        <div id="mdw" className="space-y-3 scroll-mt-24">
          {sectionHeading(t("mdw.title"), t("mdw.subtitle"))}
          <Card>{orderedList(MDW_FACT_KEYS, "mdw.facts")}</Card>
        </div>

        <div className="space-y-3">
          {sectionHeading(t("mdw.flexTitle"), t("mdw.flexSubtitle"))}
          <Card>{orderedList(MDW_FLEX_KEYS, "mdw.flex")}</Card>
        </div>

        <div className="space-y-3">
          {sectionHeading(t("mdw.payTitle"), t("mdw.paySubtitle"))}
          <Card className="space-y-3">
            <p className="text-sm text-ink">{t("mdw.payFormula")}</p>
            <p className="rounded-xl bg-brand-soft px-4 py-3 text-sm text-ink">
              {t("mdw.payExample", {
                salary: MDW_PAY_EXAMPLE.monthlySalary,
                divisor: MDW_PAY_EXAMPLE.divisor,
                dayRate: MDW_PAY_EXAMPLE.dayRate,
              })}
            </p>
            <a
              href={REST_DAY_LINKS.mdwPayFaq}
              target="_blank"
              rel="noopener noreferrer"
              className={EXTERNAL_LINK_CLASS}
            >
              {t("mdw.payLink")}
            </a>
          </Card>
        </div>

        <div id="work-permit" className="space-y-3 scroll-mt-24">
          {sectionHeading(t("wp.title"), t("wp.subtitle"))}
          <Card className="space-y-4">
            {orderedList(WP_FACT_KEYS, "wp.facts")}
            <a
              href={REST_DAY_LINKS.employmentActRest}
              target="_blank"
              rel="noopener noreferrer"
              className={EXTERNAL_LINK_CLASS}
            >
              {t("wp.momLink")}
            </a>
          </Card>
        </div>

        <Card className="space-y-3 border-danger-border bg-danger-soft">
          <h3 className="font-semibold text-danger">{t("denied.title")}</h3>
          <p className="text-sm text-ink-muted">{t("denied.subtitle")}</p>
          {orderedList(IF_DENIED_KEYS, "denied.steps")}
          <a
            href={REST_DAY_LINKS.reportInfringement}
            target="_blank"
            rel="noopener noreferrer"
            className={EXTERNAL_LINK_CLASS}
          >
            {t("denied.reportLink")}
          </a>
        </Card>

        <div className="space-y-3">
          {sectionHeading(t("helplines.title"), t("helplines.subtitle"))}
          <div className="grid gap-3 sm:grid-cols-2">
            {REST_DAY_HELPLINE_IDS.map((id) => {
              const contact = getEmergencyContact(id);
              return (
                <Card key={id} className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
                        <PhoneAlertIcon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-ink">
                          {tEmergency(`contacts.${id}.name`)}
                        </p>
                        <p className="text-xs text-ink-subtle">
                          {tEmergency(`contacts.${id}.hours`)}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`tel:${contact.phone}`}
                      className="shrink-0 rounded-xl border border-brand-soft-border bg-brand-soft px-3 py-2 text-sm font-bold tabular-nums text-brand-strong"
                    >
                      {contact.display}
                    </a>
                  </div>
                  {contact.whatsapp ? (
                    <a
                      href={whatsappUrl(contact.whatsapp.number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-brand-strong underline"
                    >
                      {tEmergency("whatsappLabel", { number: contact.whatsapp.display })}
                    </a>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </div>

        <Card className="space-y-2">
          <p className="font-semibold text-ink">{t("links.title")}</p>
          <p className="text-sm text-ink-muted">{t("links.subtitle")}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-sm">
            <a
              href={REST_DAY_LINKS.pressRelease}
              target="_blank"
              rel="noopener noreferrer"
              className={EXTERNAL_LINK_CLASS}
            >
              {t("links.pressRelease")}
            </a>
            <a
              href={REST_DAY_LINKS.mdwWellbeing}
              target="_blank"
              rel="noopener noreferrer"
              className={EXTERNAL_LINK_CLASS}
            >
              {t("links.wellbeing")}
            </a>
            <a
              href={REST_DAY_LINKS.mdwRestDayGuide}
              target="_blank"
              rel="noopener noreferrer"
              className={EXTERNAL_LINK_CLASS}
            >
              {t("links.restDayGuide")}
            </a>
            <a
              href={REST_DAY_LINKS.mdwHandyBurmese}
              target="_blank"
              rel="noopener noreferrer"
              className={EXTERNAL_LINK_CLASS}
            >
              {t("links.handyBurmese")}
            </a>
            <a
              href={REST_DAY_LINKS.employmentActRest}
              target="_blank"
              rel="noopener noreferrer"
              className={EXTERNAL_LINK_CLASS}
            >
              {t("links.employmentAct")}
            </a>
            <a
              href={REST_DAY_LINKS.reportInfringement}
              target="_blank"
              rel="noopener noreferrer"
              className={EXTERNAL_LINK_CLASS}
            >
              {t("links.infringement")}
            </a>
            <a
              href={REST_DAY_LINKS.tadm}
              target="_blank"
              rel="noopener noreferrer"
              className={EXTERNAL_LINK_CLASS}
            >
              {t("links.tadm")}
            </a>
          </div>
        </Card>

        <div className="flex flex-wrap gap-3">
          <LinkButton href="/off-day-guide" variant="secondary">
            {t("ctaOffDay")}
          </LinkButton>
          <LinkButton href="/emergency-contacts">{t("ctaEmergency")}</LinkButton>
        </div>

        <p className="text-xs text-ink-subtle">{t("sourceDisclaimer")}</p>
        <PageDiscussionSection pageKey="rest-day-rights" />
      </section>
    </PageCard>
  );
}
