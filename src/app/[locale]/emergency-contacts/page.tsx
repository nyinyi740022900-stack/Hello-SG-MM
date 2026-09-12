import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { PageHeader, Card } from "@/components/ui/Card";
import { PhoneAlertIcon } from "@/components/icons";
import PageCard from "@/components/ui/PageCard";
import { resolveSelectedCountry } from "@/lib/country.server";
import {
  EMERGENCY_SECTIONS,
  PREPARE_KEYS,
  URGENT_CONTACTS,
  whatsappUrl,
  type EmergencyContact,
} from "@/lib/emergencyContacts";
import PageDiscussionSection from "@/components/PageDiscussionSection";

type EmergencyContactsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function EmergencyContactsPage({ params }: EmergencyContactsPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const t = await getTranslations("emergency");
  const tCountry = await getTranslations("country");
  const country = await resolveSelectedCountry();

  // Name, purpose, hours and links for one helpline. Kept in one place so a
  // card in the health section cannot drift from one in the work section.
  const renderContact = (contact: EmergencyContact) => (
    <Card key={contact.id} className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
            <PhoneAlertIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ink">{t(`contacts.${contact.id}.name`)}</p>
            <p className="text-sm text-ink-muted">{t(`contacts.${contact.id}.hint`)}</p>
          </div>
        </div>
        <a
          href={`tel:${contact.phone}`}
          className="shrink-0 rounded-xl border border-brand-soft-border bg-brand-soft px-3 py-2 text-sm font-bold tabular-nums text-brand-strong transition active:scale-[0.98]"
        >
          {contact.display}
        </a>
      </div>

      <p className="text-xs text-ink-subtle">{t(`contacts.${contact.id}.hours`)}</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold">
        {contact.whatsapp ? (
          <a
            href={whatsappUrl(contact.whatsapp.number)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-strong underline"
          >
            {t("whatsappLabel", { number: contact.whatsapp.display })}
          </a>
        ) : null}
        {contact.url ? (
          <a
            href={contact.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-strong underline"
          >
            {t("officialPage")}
          </a>
        ) : null}
      </div>
    </Card>
  );

  return (
    <PageCard>
      <section className="space-y-8">
        <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-danger">
            {t("urgentTitle")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {URGENT_CONTACTS.map((contact) => (
              // A container rather than one big link: the text fallback below
              // has to be its own anchor, and nesting anchors is invalid.
              <div
                key={contact.id}
                className="space-y-3 rounded-2xl border-2 border-danger-border bg-danger-soft p-5 shadow-sm"
              >
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center justify-between gap-4 transition active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-danger text-white">
                      <PhoneAlertIcon className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="font-bold text-danger">{t(`contacts.${contact.id}.name`)}</p>
                      <p className="text-sm text-ink-muted">{t("tapToCall")}</p>
                    </div>
                  </div>
                  <span className="text-3xl font-extrabold tabular-nums text-danger">
                    {contact.display}
                  </span>
                </a>

                <p className="text-sm text-ink">{t(`contacts.${contact.id}.hint`)}</p>

                {contact.sms ? (
                  <a
                    href={`sms:${contact.sms.number}`}
                    className="block rounded-xl border border-danger-border bg-surface p-3 text-xs font-semibold text-ink"
                  >
                    {t(`contacts.${contact.id}.smsHint`)}
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {EMERGENCY_SECTIONS.map((section) => (
          <div key={section.id} className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-subtle">
                {t(`sections.${section.id}.title`)}
              </h3>
              <p className="text-sm text-ink-muted">{t(`sections.${section.id}.subtitle`)}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {section.contacts.map(renderContact)}
            </div>
          </div>
        ))}

        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-subtle">
              {t("missionTitle")}
            </h3>
            <p className="text-sm text-ink-muted">{t("missionSubtitle")}</p>
          </div>

          {/* The reader's own mission, not a fixed one. This page is reached
              by someone in trouble, and sending a Bangladeshi worker to the
              Myanmar embassy's switchboard is the kind of mistake that costs
              them the evening. Countries whose mission publishes no number
              get the mission's page instead of a dead tel: link. */}
          <Card className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-lg"
                >
                  {country.flag}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{country.mission.name}</p>
                  <p className="text-sm text-ink-muted">{tCountry("missionInSingapore")}</p>
                </div>
              </div>
              {country.mission.phone ? (
                <a
                  href={`tel:${country.mission.phone.replace(/\s/g, "")}`}
                  className="shrink-0 rounded-xl border border-brand-soft-border bg-brand-soft px-3 py-2 text-sm font-bold tabular-nums text-brand-strong transition active:scale-[0.98]"
                >
                  {country.mission.phone}
                </a>
              ) : null}
            </div>

            {country.mission.address ? (
              <p className="text-sm text-ink">
                <span className="text-ink-subtle">{tCountry("addressLabel")}: </span>
                {country.mission.address}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold">
              <a
                href={country.mission.consularUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-strong underline"
              >
                {tCountry("consularServices")}
              </a>
              <a
                href={country.mission.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-strong underline"
              >
                {tCountry("officialSite")}
              </a>
            </div>

            <p className="text-xs text-ink-subtle">{tCountry("verifyNote")}</p>
          </Card>
        </div>

        <Card className="space-y-3">
          <h3 className="font-semibold text-ink">{t("prepareTitle")}</h3>
          <ul className="space-y-3">
            {PREPARE_KEYS.map((key, index) => (
              <li key={key} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-strong">
                  {index + 1}
                </span>
                <span className="text-sm text-ink">{t(`prepare.${key}`)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <p className="text-xs text-ink-subtle">{t("verifiedNote")}</p>
        <PageDiscussionSection pageKey="emergency-contacts" />
      </section>
    </PageCard>
  );
}
