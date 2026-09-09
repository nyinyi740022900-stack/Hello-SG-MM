import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import Image from "next/image";
import { PageHeader, Card } from "@/components/ui/Card";
import StatusMessage from "@/components/ui/StatusMessage";
import { routing } from "@/i18n/routing";
import PageCard from "@/components/ui/PageCard";
import { getCountry } from "@/lib/countries";
import { getSelectedCountryCode } from "@/lib/country.server";
import {
  OFF_DAY_PLACES,
  getPlacePhotos,
  type OffDayPlace,
  type PlaceCost,
} from "@/lib/offDayPlaces";
import { listPlaceComments, countCommentsByPlace } from "@/lib/placeComments";
import PlaceComments from "@/components/PlaceComments";

/**
 * Where people go on a rest day.
 *
 * Split in two. Community hubs carry the flags of whoever gathers there — a
 * place named for one community is not implicitly offered to everyone, and
 * saying "Peninsula Plaza is a Myanmar hub" is both more useful and more
 * honest than listing it as a generic "migrant" location. The reader's own
 * community sorts first; nothing is hidden, because a rest day is exactly
 * when someone might want to see somewhere new.
 *
 * Places worth visiting carry no flag, because a park belongs to whoever
 * walks into it. What they carry instead is what a day there actually costs,
 * which for this reader is the deciding fact and is very often misreported.
 */

const COST_STYLE: Record<PlaceCost, string> = {
  free: "bg-success-soft text-success",
  mixed: "bg-warning-soft text-warning",
  paid: "bg-surface-muted text-ink-muted",
};

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
  const photos = getPlacePhotos();

  // Counts for every place in one query, then the comments themselves only
  // for the places that actually have any — a page of fourteen cards should
  // not mean fourteen empty comment queries.
  const commentCounts = await countCommentsByPlace(OFF_DAY_PLACES.map((p) => p.key));
  const withComments = OFF_DAY_PLACES.filter((p) => (commentCounts.get(p.key) ?? 0) > 0);
  const commentsByPlace = new Map(
    await Promise.all(
      withComments.map(async (place) => {
        const { data } = await listPlaceComments(place.key);
        return [place.key, data] as const;
      }),
    ),
  );

  const costLabel: Record<PlaceCost, string> = {
    free: t("costFree"),
    mixed: t("costMixed"),
    paid: t("costPaid"),
  };

  const community = OFF_DAY_PLACES.filter((p) => p.section === "community");
  const toVisit = OFF_DAY_PLACES.filter((p) => p.section === "visit");

  // The reader's own community first, original order kept within each group.
  const orderedCommunity = selected
    ? [
        ...community.filter((p) => p.countries.includes(selected)),
        ...community.filter((p) => !p.countries.includes(selected)),
      ]
    : community;

  const hasOwnPlaces = selected
    ? community.some((p) => p.countries.includes(selected))
    : true;

  const renderPlace = (place: OffDayPlace) => {
    // A photo is shown only when its attribution travels with it. Every image
    // here is Creative Commons licensed and naming the author is a condition
    // of that licence, so a file without a credit block is treated as one we
    // have no right to display.
    const photo = place.photoCredit ? photos[place.key] : undefined;

    return (
      <Card key={place.key} className="space-y-2 overflow-hidden">
        {photo && place.photoCredit ? (
          <figure className="-mx-4 -mt-4 mb-1">
            <div className="relative h-44 bg-surface-muted">
              <Image
                src={photo}
                alt=""
                fill
                sizes="(min-width: 640px) 640px, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="px-4 pt-1 text-[10px] text-ink-subtle">
              <a
                href={place.photoCredit.source}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-dotted underline-offset-2"
              >
                {place.photoCredit.author}
              </a>
              {" · "}
              {place.photoCredit.license}
            </figcaption>
          </figure>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-ink">{t(`locations.${place.key}.name`)}</h3>
          {place.countries.length > 0 ? (
            <span className="flex shrink-0 gap-1" aria-hidden="true">
              {place.countries.map((code) => (
                <span key={code}>{getCountry(code).flag}</span>
              ))}
            </span>
          ) : null}
          <span
            className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${COST_STYLE[place.cost]}`}
          >
            {costLabel[place.cost]}
          </span>
        </div>

        <p className="text-sm text-ink-muted">{t(`locations.${place.key}.description`)}</p>

        <dl className="space-y-1.5 text-sm">
          <div>
            <dt className="inline font-medium text-ink">{t("gettingThereLabel")}: </dt>
            <dd className="inline text-ink-muted">
              {t(`locations.${place.key}.gettingThere`)}
            </dd>
          </div>
          <div>
            <dt className="inline font-medium text-ink">{t("foodLabel")}: </dt>
            <dd className="inline text-ink-muted">{t(`locations.${place.key}.food`)}</dd>
          </div>
        </dl>

        <p className="text-xs text-ink-subtle">{place.address}</p>

        <div className="flex flex-wrap gap-3 pt-1">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.mapsQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-brand-strong underline"
          >
            {t("openInMaps")}
          </a>
          {place.officialUrl ? (
            <a
              href={place.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-brand-strong underline"
            >
              {t("officialSite")}
            </a>
          ) : null}
        </div>

        <PlaceComments
          placeKey={place.key}
          comments={commentsByPlace.get(place.key) ?? []}
          count={commentCounts.get(place.key) ?? 0}
        />
      </Card>
    );
  };

  return (
    <PageCard>
      <section className="space-y-5">
        <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-subtle">
            {t("sectionCommunity")}
          </h2>

          {/* Malaysians are the one group with no distinct hub here: most are
              PRs, pass holders or daily commuters who live across the island
              rather than gathering in one place. Saying that is better than
              inventing a location so every flag has a row. */}
          {selected && !hasOwnPlaces ? (
            <Card className="text-sm text-ink-muted">
              {t("noPlacesYet", { country: getCountry(selected).englishName })}
            </Card>
          ) : null}

          {orderedCommunity.map(renderPlace)}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-subtle">
            {t("sectionVisit")}
          </h2>

          {/* The single most useful thing on this page for someone deciding
              how to spend a day's wages. Every "free museum" list in
              Singapore quietly means free for citizens and PRs. */}
          <StatusMessage variant="warning">
            <span className="block space-y-1">
              <span className="block font-medium">{t("museumWarningTitle")}</span>
              <span className="block">{t("museumWarningBody")}</span>
            </span>
          </StatusMessage>

          {toVisit.map(renderPlace)}

          <Card className="text-sm text-ink-muted">{t("libraryNote")}</Card>
        </div>

        <p className="text-xs text-ink-subtle">{t("sourceDisclaimer")}</p>
      </section>
    </PageCard>
  );
}
