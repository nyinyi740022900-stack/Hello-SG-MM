import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader, Card } from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";
import ContentCard from "@/components/ContentCard";
import { routing, type AppLocale } from "@/i18n/routing";
import {
  listPublishedContent,
  CONTENT_CATEGORIES,
  type ContentCategory,
} from "@/lib/content";
import PageCard from "@/components/ui/PageCard";

function isContentCategory(value: string): value is ContentCategory {
  return (CONTENT_CATEGORIES as string[]).includes(value);
}

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const appLocale = locale as AppLocale;

  const { category: rawCategory } = await searchParams;
  const category =
    rawCategory && isContentCategory(rawCategory) ? rawCategory : undefined;

  const t = await getTranslations("news");

  const { data: items, error } = await listPublishedContent({
    type: "news",
    category,
  });

  return (
    <PageCard>
      <section className="space-y-5">
        <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
            <Link
              href="/news"
              className={[
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                !category
                  ? "bg-brand text-ink-on-brand"
                  : "border border-border bg-surface text-ink-muted hover:bg-surface-muted",
              ].join(" ")}
            >
              {t("allCategories")}
            </Link>
            {CONTENT_CATEGORIES.map((c) => (
              <Link
                key={c}
                href={{ pathname: "/news", query: { category: c } }}
                className={[
                  "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                  category === c
                    ? "bg-brand text-ink-on-brand"
                    : "border border-border bg-surface text-ink-muted hover:bg-surface-muted",
                ].join(" ")}
              >
                {t(`category.${c}`)}
              </Link>
            ))}
          </div>
        </div>

        {error ? (
          <Card className="text-sm text-danger">{error}</Card>
        ) : !items || items.length === 0 ? (
          <Card className="text-sm text-ink-muted">
            {category ? t("emptyInCategory") : t("empty")}
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <ContentCard key={item.id} item={item} locale={appLocale} />
            ))}
          </div>
        )}

        <p className="text-xs text-ink-subtle">{t("disclaimer")}</p>
      </section>
    </PageCard>
  );
}
