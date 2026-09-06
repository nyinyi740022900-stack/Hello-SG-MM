import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader, Card } from "@/components/ui/Card";
import CategoryBadge from "@/components/CategoryBadge";
import { routing, type AppLocale } from "@/i18n/routing";
import {
  listDirectoryEntries,
  CONTENT_CATEGORIES,
  type ContentCategory,
  type ContentItem,
} from "@/lib/content";

export default async function DirectoryPage({
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

  const t = await getTranslations("directory");

  const { data: items, error } = await listDirectoryEntries();

  const groups: Partial<Record<ContentCategory, ContentItem[]>> = {};
  if (items) {
    for (const item of items) {
      const list = groups[item.category] ?? [];
      list.push(item);
      groups[item.category] = list;
    }
  }

  const nonEmptyCategories = CONTENT_CATEGORIES.filter(
    (category) => (groups[category]?.length ?? 0) > 0,
  );

  return (
    <section className="space-y-5">
      <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

      {error ? (
        <Card className="text-sm text-danger">{error}</Card>
      ) : !items || items.length === 0 ? (
        <Card className="text-sm text-ink-muted">{t("empty")}</Card>
      ) : (
        <div className="space-y-6">
          {nonEmptyCategories.map((category) => (
            <div key={category} className="space-y-3">
              <CategoryBadge category={category} />
              <div className="space-y-3">
                {groups[category]!.map((item) => {
                  const title = isMy ? item.title_my : item.title_en;
                  const description = isMy
                    ? item.summary_my || item.body_my
                    : item.summary_en || item.body_en;

                  return (
                    <Card key={item.id} className="space-y-2">
                      <h3 className="font-semibold text-ink">{title}</h3>
                      {description ? (
                        <p className="text-sm text-ink-muted">{description}</p>
                      ) : null}

                      <div className="space-y-1 text-sm">
                        {item.phone ? (
                          <p>
                            <a
                              href={`tel:${item.phone.replace(/\s+/g, "")}`}
                              className="font-medium text-brand-strong underline"
                            >
                              {t("callLabel")}: {item.phone}
                            </a>
                          </p>
                        ) : null}
                        {item.website ? (
                          <p>
                            <a
                              href={item.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-brand-strong underline"
                            >
                              {t("websiteLabel")}: {item.website}
                            </a>
                          </p>
                        ) : null}
                        {item.opening_hours ? (
                          <p className="text-ink">
                            <span className="font-semibold text-ink-subtle">
                              {t("hoursLabel")}:{" "}
                            </span>
                            {item.opening_hours}
                          </p>
                        ) : null}
                        {item.languages && item.languages.length > 0 ? (
                          <p className="text-ink">
                            <span className="font-semibold text-ink-subtle">
                              {t("languagesLabel")}:{" "}
                            </span>
                            {item.languages.join(", ")}
                          </p>
                        ) : null}
                      </div>

                      {item.is_free === true ? (
                        <span className="inline-flex rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-strong">
                          {t("freeLabel")}
                        </span>
                      ) : null}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-ink-subtle">{t("disclaimer")}</p>
    </section>
  );
}
