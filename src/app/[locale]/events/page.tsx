import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader, Card } from "@/components/ui/Card";
import CategoryBadge from "@/components/CategoryBadge";
import { routing, type AppLocale } from "@/i18n/routing";
import { listUpcomingEvents, type ContentItem } from "@/lib/content";
import PageCard from "@/components/ui/PageCard";
import PageDiscussionSection from "@/components/PageDiscussionSection";

function formatWhen(item: ContentItem, locale: AppLocale): string | null {
  if (!item.starts_at) {
    return null;
  }

  const intlLocale = locale === "my" ? "my-MM" : "en-SG";
  const starts = new Date(item.starts_at);

  if (Number.isNaN(starts.getTime())) {
    return null;
  }

  const dateTimeFormat: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" };
  const timeFormat: Intl.DateTimeFormatOptions = { timeStyle: "short" };

  if (!item.ends_at) {
    return starts.toLocaleString(intlLocale, dateTimeFormat);
  }

  const ends = new Date(item.ends_at);
  if (Number.isNaN(ends.getTime())) {
    return starts.toLocaleString(intlLocale, dateTimeFormat);
  }

  const sameDay =
    starts.getFullYear() === ends.getFullYear() &&
    starts.getMonth() === ends.getMonth() &&
    starts.getDate() === ends.getDate();

  if (sameDay) {
    const datePart = starts.toLocaleString(intlLocale, dateTimeFormat);
    const endTimePart = ends.toLocaleString(intlLocale, timeFormat);
    return `${datePart} – ${endTimePart}`;
  }

  const startPart = starts.toLocaleString(intlLocale, dateTimeFormat);
  const endPart = ends.toLocaleString(intlLocale, dateTimeFormat);
  return `${startPart} – ${endPart}`;
}

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const appLocale = locale as AppLocale;
  const isMy = appLocale === "my";

  const t = await getTranslations("events");

  const { data: items, error } = await listUpcomingEvents();

  return (
    <PageCard>
      <section className="space-y-5">
        <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

        {error ? (
          <Card className="text-sm text-danger">{error}</Card>
        ) : !items || items.length === 0 ? (
          <Card className="text-sm text-ink-muted">{t("empty")}</Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const title = isMy ? item.title_my : item.title_en;
              const description = isMy
                ? item.summary_my || item.body_my
                : item.summary_en || item.body_en;
              const when = formatWhen(item, appLocale);
              const hasWhere = Boolean(item.location_name || item.address);

              return (
                <Card key={item.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-ink">{title}</h3>
                    <CategoryBadge category={item.category} />
                  </div>

                  {description ? <p className="text-sm text-ink-muted">{description}</p> : null}

                  {when || hasWhere ? (
                    <div className="space-y-1 rounded-xl bg-surface-muted p-3 text-sm">
                      {when ? (
                        <p className="text-ink">
                          <span className="font-semibold text-ink-subtle">{t("whenLabel")}: </span>
                          {when}
                        </p>
                      ) : null}
                      {hasWhere ? (
                        <p className="text-ink">
                          <span className="font-semibold text-ink-subtle">{t("whereLabel")}: </span>
                          {[item.location_name, item.address].filter(Boolean).join(", ")}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {item.source_url ? (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex text-sm font-medium text-brand-strong underline"
                    >
                      {item.source_url}
                    </a>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}

        <p className="text-xs text-ink-subtle">{t("disclaimer")}</p>
        <PageDiscussionSection pageKey="events" />
      </section>
    </PageCard>
  );
}
