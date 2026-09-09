import { getTranslations } from "next-intl/server";
import { PageHeader, Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import StatusMessage from "@/components/ui/StatusMessage";
import PassportFormDownloads from "@/components/PassportFormDownloads";
import CountryMissionCard from "@/components/CountryMissionCard";
import PageCard from "@/components/ui/PageCard";
import { PhoneAlertIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { resolveSelectedCountry } from "@/lib/country.server";
import { isCountryCode } from "@/lib/countries";
import { whatsappUrl } from "@/lib/emergencyContacts";
import {
  APPOINTMENT_CHANNELS,
  APPOINTMENT_STEP_KEYS,
  DOCUMENT_KEYS,
  EMBASSY_ADDRESS,
  EMBASSY_FORMS,
  EMBASSY_LINKS,
  EMBASSY_PHONES,
  LOST_PASSPORT_KEYS,
  OTHER_COUNTRY_PASSPORT_LINKS,
  OTHER_COUNTRY_STEP_KEYS,
  OTHER_FEES,
  OTHER_SERVICES,
  PREPARE_KEYS,
  RENEWAL_FEES,
  SITUATION_KEYS,
  TAX_DOCUMENT_KEYS,
  VISIT_KEYS,
} from "@/lib/passportRenewal";

const EXTERNAL_LINK_CLASS = "font-semibold text-brand-strong underline";

export default async function PassportChecklistPage() {
  const t = await getTranslations("checklist");
  const tCountry = await getTranslations("country");
  const country = await resolveSelectedCountry();

  const orderedList = (keys: readonly string[], prefix: string) => (
    <ul className="space-y-3">
      {keys.map((key, index) => (
        <li key={key} className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
            {index + 1}
          </span>
          <span className="text-ink">{t(`${prefix}.${key}`)}</span>
        </li>
      ))}
    </ul>
  );

  const bulletList = (keys: readonly string[], prefix: string) => (
    <ul className="space-y-3">
      {keys.map((key) => (
        <li key={key} className="flex items-start gap-3">
          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
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

  const otherCountryLinks =
    isCountryCode(country.code) && country.code !== "mm"
      ? OTHER_COUNTRY_PASSPORT_LINKS[country.code]
      : [];

  return (
    <PageCard>
      <section className="space-y-8">
        <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

        <CountryMissionCard country={country} />

        {/* The detailed checklist below was written from, and checked against,
            the Myanmar embassy's own guidance. Showing it to a Bangladeshi or
            Malaysian reader under their own flag would be inventing a
            procedure we have never verified, so the other countries get the
            mission card above, their own official start links, and an honest
            statement of what we do not have yet — not a Myanmar checklist
            with the labels swapped. */}
        {country.hasLocalPassportGuide ? (
          <>
            <StatusMessage variant="error">
              <span className="block space-y-2">
                <span className="block font-medium">{t("scamWarningTitle")}</span>
                <span className="block">{t("scamWarningBody")}</span>
                <a
                  href={whatsappUrl(APPOINTMENT_CHANNELS[0].whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={EXTERNAL_LINK_CLASS}
                >
                  {t("scamReportLink", { number: APPOINTMENT_CHANNELS[0].display })}
                </a>
              </span>
            </StatusMessage>

            <div className="space-y-3">
              {sectionHeading(t("embassyContact.title"), t("embassyContact.subtitle"))}
              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href={EMBASSY_LINKS.maps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-4 transition hover:border-brand-soft-border hover:bg-brand-soft"
                >
                  <div>
                    <p className="font-semibold text-ink">{t("embassyContact.addressLabel")}</p>
                    <p className="text-sm text-ink-muted">{EMBASSY_ADDRESS}</p>
                    <p className="mt-1 text-xs text-ink-subtle">{t("embassyContact.mapsHint")}</p>
                  </div>
                </a>
                {EMBASSY_PHONES.map((phone) => (
                  <a
                    key={phone.id}
                    href={`tel:${phone.phone}`}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-4 transition hover:border-brand-soft-border hover:bg-brand-soft"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
                        <PhoneAlertIcon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-ink">
                          {t(`embassyContact.phones.${phone.id}.name`)}
                        </p>
                        <p className="text-xs text-ink-subtle">
                          {t(`embassyContact.phones.${phone.id}.hours`)}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 font-bold tabular-nums text-brand-strong">
                      {phone.display}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {sectionHeading(t("appointment.title"), t("appointment.subtitle"))}

              <Card className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {APPOINTMENT_CHANNELS.map((channel) => (
                    <a
                      key={channel.id}
                      href={whatsappUrl(channel.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col gap-1 rounded-xl border border-brand-soft-border bg-brand-soft p-4 transition active:scale-[0.99]"
                    >
                      <span className="text-sm font-semibold text-ink">
                        {t(`appointment.channels.${channel.id}.passes`)}
                      </span>
                      <span className="font-bold tabular-nums text-brand-strong">
                        {channel.display}
                      </span>
                      <span className="text-xs text-ink-subtle">{t("appointment.whatsappHint")}</span>
                    </a>
                  ))}
                </div>

                {orderedList(APPOINTMENT_STEP_KEYS, "appointment.steps")}

                <a
                  href={EMBASSY_LINKS.appointmentList}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={EXTERNAL_LINK_CLASS}
                >
                  {t("appointment.listLink")}
                </a>
              </Card>
            </div>

            <div className="space-y-3">
              {sectionHeading(t("documentsTitle"), t("documentsSubtitle"))}
              <Card>{orderedList(DOCUMENT_KEYS, "items")}</Card>

              <Card className="space-y-3">
                <p className="font-semibold text-ink">{t("situationsTitle")}</p>
                {bulletList(SITUATION_KEYS, "situations")}
              </Card>
            </div>

            <div className="space-y-3">
              {sectionHeading(t("visitTitle"), t("visitSubtitle"))}
              <Card className="space-y-4">
                {bulletList(VISIT_KEYS, "visit")}
                <a
                  href={EMBASSY_LINKS.maps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={EXTERNAL_LINK_CLASS}
                >
                  {t("visit.openMap")}
                </a>
              </Card>
            </div>

            <div className="space-y-3">
              {sectionHeading(t("fees.title"), t("fees.subtitle"))}
              <Card className="space-y-3">
                <dl className="divide-y divide-border">
                  {RENEWAL_FEES.map((fee) => (
                    <div key={fee.id} className="flex items-start justify-between gap-4 py-2">
                      <dt className="text-sm text-ink">{t(`fees.items.${fee.id}`)}</dt>
                      <dd className="shrink-0 font-bold tabular-nums text-ink">{fee.amount}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-sm font-semibold text-ink">{t("fees.otherTitle")}</p>
                <dl className="divide-y divide-border">
                  {OTHER_FEES.map((fee) => (
                    <div key={fee.id} className="flex items-start justify-between gap-4 py-2">
                      <dt className="text-sm text-ink">{t(`fees.items.${fee.id}`)}</dt>
                      <dd className="shrink-0 font-bold tabular-nums text-ink">{fee.amount}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-xs text-ink-subtle">{t("fees.note")}</p>
              </Card>
            </div>

            <div className="space-y-3">
              {sectionHeading(t("tax.title"), t("tax.subtitle"))}
              <Card className="space-y-3">
                {bulletList(TAX_DOCUMENT_KEYS, "tax.items")}
                <a
                  href={EMBASSY_FORMS.find((form) => form.id === "tax")?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={EXTERNAL_LINK_CLASS}
                >
                  {t("tax.formLink")}
                </a>
              </Card>
            </div>

            <div className="space-y-3">
              {sectionHeading(t("lost.title"), t("lost.subtitle"))}
              <Card className="space-y-3">
                {bulletList(LOST_PASSPORT_KEYS, "lost.items")}
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-sm">
                  <a
                    href={EMBASSY_LINKS.policeReport}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={EXTERNAL_LINK_CLASS}
                  >
                    {t("lost.policeLink")}
                  </a>
                  <a
                    href={EMBASSY_FORMS.find((form) => form.id === "lost")?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={EXTERNAL_LINK_CLASS}
                  >
                    {t("lost.formLink")}
                  </a>
                </div>
              </Card>
            </div>

            <div className="space-y-3">
              {sectionHeading(t("otherServices.title"), t("otherServices.subtitle"))}
              <div className="grid gap-3 sm:grid-cols-2">
                {OTHER_SERVICES.map((service) => {
                  const form = service.formId
                    ? EMBASSY_FORMS.find((item) => item.id === service.formId)
                    : null;
                  return (
                    <Card key={service.id} className="space-y-2">
                      <p className="font-semibold text-ink">
                        {t(`otherServices.items.${service.id}.name`)}
                      </p>
                      <p className="text-sm text-ink-muted">
                        {t(`otherServices.items.${service.id}.hint`)}
                      </p>
                      {form ? (
                        <a
                          href={form.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-brand-strong underline"
                        >
                          {t("otherServices.downloadForm")}
                        </a>
                      ) : (
                        <a
                          href={EMBASSY_LINKS.consular}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-brand-strong underline"
                        >
                          {t("otherServices.seeConsular")}
                        </a>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {sectionHeading(t("forms.title"), t("forms.subtitle"))}
              <PassportFormDownloads />
              <Card className="space-y-3">
                <p className="text-sm text-ink-muted">{t("forms.embassyHint")}</p>
                <ul className="space-y-2">
                  {EMBASSY_FORMS.map((form) => (
                    <li key={form.id}>
                      <a
                        href={form.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-brand-strong underline"
                      >
                        {t(`forms.items.${form.id}`)}
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <Card className="space-y-3">
              <h3 className="font-semibold text-ink">{t("prepareTitle")}</h3>
              {orderedList(PREPARE_KEYS, "prepare")}
            </Card>

            <StatusMessage variant="warning">
              <span className="block space-y-2">
                <span className="block font-medium">{t("remittanceWarningTitle")}</span>
                <span className="block">{t("remittanceWarningBody")}</span>
                <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <Link href="/news" className={EXTERNAL_LINK_CLASS}>
                    {t("remittanceNewsLink")}
                  </Link>
                  <a
                    href={EMBASSY_LINKS.labourNotice}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={EXTERNAL_LINK_CLASS}
                  >
                    {t("labourNoticeLink")}
                  </a>
                </span>
              </span>
            </StatusMessage>

            <Card className="space-y-2">
              <p className="font-semibold text-ink">{t("officialLinksTitle")}</p>
              <p className="text-sm text-ink-muted">{t("officialLinksSubtitle")}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-sm">
                <a
                  href={EMBASSY_LINKS.consular}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={EXTERNAL_LINK_CLASS}
                >
                  {t("officialLinkConsular")}
                </a>
                <a
                  href={EMBASSY_LINKS.appointmentList}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={EXTERNAL_LINK_CLASS}
                >
                  {t("officialLinkAppointments")}
                </a>
                <a
                  href={EMBASSY_LINKS.contact}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={EXTERNAL_LINK_CLASS}
                >
                  {t("officialLinkContact")}
                </a>
              </div>
            </Card>

            <div className="flex flex-wrap gap-3">
              <LinkButton href="/guide" variant="secondary">
                {t("ctaGuide")}
              </LinkButton>
              <LinkButton href="/passport/wizard">{t("ctaWizard")}</LinkButton>
            </div>

            <p className="text-xs text-ink-subtle">{t("sourceDisclaimer")}</p>
          </>
        ) : (
          <>
            <StatusMessage variant="info">
              <span className="block space-y-1">
                <span className="block font-medium">
                  {tCountry("noGuideTitle", { country: country.englishName })}
                </span>
                <span className="block">{tCountry("noGuideBody")}</span>
              </span>
            </StatusMessage>

            <div className="space-y-3">
              {sectionHeading(
                t("otherCountries.title", { country: country.englishName }),
                t("otherCountries.subtitle"),
              )}
              <Card className="space-y-4">
                {orderedList(OTHER_COUNTRY_STEP_KEYS, `otherCountries.${country.code}.steps`)}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {otherCountryLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={EXTERNAL_LINK_CLASS}
                    >
                      {t(`otherCountries.links.${country.code}.${link.id}`)}
                    </a>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}
      </section>
    </PageCard>
  );
}
