import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/ui/Card";
import { PhoneAlertIcon } from "@/components/icons";
import PageCard from "@/components/ui/PageCard";
import { resolveSelectedCountry } from "@/lib/country.server";

const GROUPS = [
  {
    key: "police",
    urgent: true,
    contacts: [{ id: "police", phone: "999", display: "999" }],
  },
  {
    key: "ambulanceFire",
    urgent: true,
    contacts: [{ id: "ambulanceFire", phone: "995", display: "995" }],
  },
  {
    key: "mom",
    urgent: false,
    contacts: [{ id: "mom", phone: "+6564385122", display: "+65 6438 5122" }],
  },
] as const;

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

  const urgentGroups = GROUPS.filter((group) => group.urgent);
  const otherGroups = GROUPS.filter((group) => !group.urgent);

  return (
    <PageCard>
      <section className="space-y-6">
        <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

        <div className="grid gap-3 sm:grid-cols-2">
          {urgentGroups.map((group) => (
            <a
              key={group.key}
              href={`tel:${group.contacts[0].phone}`}
              className="flex items-center justify-between gap-4 rounded-2xl border-2 border-danger-border bg-danger-soft p-5 shadow-sm transition active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-danger text-white">
                  <PhoneAlertIcon className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-bold text-danger">{t(`${group.key}.name`)}</p>
                  <p className="text-sm text-ink-muted">{t("tapToCall")}</p>
                </div>
              </div>
              <span className="text-xl font-extrabold tabular-nums text-danger">
                {group.contacts[0].display}
              </span>
            </a>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-subtle">
            {t("otherContacts")}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {otherGroups.map((group) => (
              <a
                key={group.key}
                href={`tel:${group.contacts[0].phone}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 transition hover:border-brand-soft-border hover:bg-brand-soft"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
                    <PhoneAlertIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{t(`${group.key}.name`)}</p>
                    <p className="text-xs text-ink-subtle">{t(`${group.key}.hint`)}</p>
                  </div>
                </div>
                <span className="font-bold tabular-nums text-brand-strong">
                  {group.contacts[0].display}
                </span>
              </a>
            ))}

            {/* The reader's own mission, not a fixed one. This page is reached
                by someone in trouble, and sending a Bangladeshi worker to the
                Myanmar embassy's switchboard is the kind of mistake that costs
                them the evening. Countries whose mission publishes no number
                get a link to the mission instead of a dead tel: link. */}
            <a
              href={country.mission.phone
                ? `tel:${country.mission.phone.replace(/\s/g, "")}`
                : country.mission.url}
              target={country.mission.phone ? undefined : "_blank"}
              rel={country.mission.phone ? undefined : "noopener noreferrer"}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 transition hover:border-brand-soft-border hover:bg-brand-soft"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-lg"
                >
                  {country.flag}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{country.mission.name}</p>
                  <p className="text-xs text-ink-subtle">
                    {tCountry("missionInSingapore")}
                  </p>
                </div>
              </div>
              <span className="shrink-0 font-bold tabular-nums text-brand-strong">
                {country.mission.phone ?? tCountry("officialSite")}
              </span>
            </a>
          </div>
        </div>
      </section>
    </PageCard>
  );
}
