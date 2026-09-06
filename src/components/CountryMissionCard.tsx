import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import type { Country } from "@/lib/countries";

/**
 * The selected country's mission in Singapore: who to contact, and the
 * official page to check before travelling there.
 *
 * Everything that moves — fees, hours, appointment rules, document lists —
 * lives behind the links rather than in this card. Copying it here would look
 * more helpful and be less true the moment the mission changed it, and a
 * wrong document list costs someone a day of leave.
 */
export default async function CountryMissionCard({ country }: { country: Country }) {
  const t = await getTranslations("country");
  const { mission } = country;

  return (
    <Card className="space-y-3">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="text-2xl leading-none">
          {country.flag}
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold text-ink">{mission.name}</h2>
          <p className="text-sm text-ink-muted">{t("missionInSingapore")}</p>
        </div>
      </div>

      {mission.address ? (
        <p className="text-sm text-ink">
          <span className="text-ink-subtle">{t("addressLabel")}: </span>
          {mission.address}
        </p>
      ) : null}

      {mission.phone ? (
        <p className="text-sm text-ink">
          <span className="text-ink-subtle">{t("phoneLabel")}: </span>
          <a href={`tel:${mission.phone.replace(/\s/g, "")}`} className="text-brand-strong underline">
            {mission.phone}
          </a>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-1">
        <a
          href={mission.consularUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-brand-strong underline"
        >
          {t("consularServices")}
        </a>
        <a
          href={mission.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-brand-strong underline"
        >
          {t("officialSite")}
        </a>
      </div>

      <p className="text-xs text-ink-subtle">{t("verifyNote")}</p>
    </Card>
  );
}
