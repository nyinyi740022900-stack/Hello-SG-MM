import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { PageHeader, Card } from "@/components/ui/Card";
import { routing } from "@/i18n/routing";
import PageCard from "@/components/ui/PageCard";
import { getCountry, type CountryCode } from "@/lib/countries";
import { getSelectedCountryCode } from "@/lib/country.server";

/**
 * Where people go on a rest day.
 *
 * Each place carries the community it belongs to, for two reasons. The reader
 * sees their own community's places first, which is the whole point of the
 * page for someone with one free day. And a place named for one community is
 * not implicitly offered to everyone — Peninsula Plaza is a Myanmar hub, and
 * saying so is more useful, and more honest, than listing it as a generic
 * "migrant" location.
 *
 * `countries` is a list because Little India genuinely serves South Asian
 * communities together rather than being divided between them.
 */
const LOCATIONS: {
  key: string;
  countries: CountryCode[];
  address: string;
  mapsQuery: string;
}[] = [
  {
    key: "peninsulaPlaza",
    countries: ["mm"],
    address: "111 North Bridge Road, Singapore 179098",
    mapsQuery: "Peninsula Plaza Singapore",
  },
  {
    key: "burmeseTemple",
    countries: ["mm"],
    address: "14 Tai Gin Road, Singapore 327873",
    mapsQuery: "Burmese Buddhist Temple Singapore",
  },
  {
    key: "farrerPark",
    countries: ["mm"],
    address: "Stamford Road / Farrer Park / Little India area",
    mapsQuery: "Farrer Park MRT Singapore",
  },
  {
    key: "tekkaCentre",
    countries: ["in", "bd"],
    address: "665 Buffalo Road, Singapore 210665 — at Little India MRT (NE7 / DT12)",
    mapsQuery: "Tekka Centre Singapore",
  },
  {
    key: "bangladeshSquare",
    countries: ["bd"],
    address: "Desker Road at Lembu Road, Little India — nearest MRT Farrer Park (NE8)",
    mapsQuery: "Desker Road Lembu Road Singapore",
  },
  {
    key: "mustafa",
    countries: ["in", "bd"],
    address: "145 Syed Alwi Road, Singapore 207704 — nearest MRT Farrer Park (NE8)",
    mapsQuery: "Mustafa Centre Singapore",
  },
  {
    key: "peoplesPark",
    countries: ["cn"],
    address: "1 Park Road, Singapore 059108 — at Chinatown MRT (NE4 / DT19)",
    mapsQuery: "People's Park Complex Singapore",
  },
];

export default async function OffDayGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations("offDayGuide");
  const selected = await getSelectedCountryCode();

  // The reader's own community first, original order kept within each group.
  // Nothing is hidden: someone may want to visit another community's places,
  // and a rest day is exactly when people explore.
  const ordered = selected
    ? [
        ...LOCATIONS.filter((loc) => loc.countries.includes(selected)),
        ...LOCATIONS.filter((loc) => !loc.countries.includes(selected)),
      ]
    : LOCATIONS;

  const hasOwnPlaces = selected
    ? LOCATIONS.some((loc) => loc.countries.includes(selected))
    : true;

  return (
    <PageCard>
      <section className="space-y-5">
        <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

        {/* Malaysians are the one group with no distinct hub here: most are
            PRs, pass holders or daily commuters who live across the island
            rather than gathering in one place. Saying that is better than
            inventing a location so every flag has a row. */}
        {selected && !hasOwnPlaces ? (
          <Card className="text-sm text-ink-muted">
            {t("noPlacesYet", { country: getCountry(selected).englishName })}
          </Card>
        ) : null}

        <div className="space-y-3">
          {ordered.map((loc) => (
            <Card key={loc.key} className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-ink">{t(`locations.${loc.key}.name`)}</h3>
                <span className="flex shrink-0 gap-1" aria-hidden="true">
                  {loc.countries.map((code) => (
                    <span key={code}>{getCountry(code).flag}</span>
                  ))}
                </span>
              </div>
              <p className="text-sm text-ink-muted">{t(`locations.${loc.key}.description`)}</p>
              <p className="text-xs text-ink-subtle">{loc.address}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.mapsQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-xs font-medium text-brand-strong underline"
              >
                {t("openInMaps")}
              </a>
            </Card>
          ))}
        </div>

        <p className="text-xs text-ink-subtle">{t("sourceDisclaimer")}</p>
      </section>
    </PageCard>
  );
}
