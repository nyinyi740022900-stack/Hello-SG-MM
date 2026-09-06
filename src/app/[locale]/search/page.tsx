import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import PageCard from "@/components/ui/PageCard";
import { PageHeader } from "@/components/ui/Card";
import ContentCard from "@/components/ContentCard";
import SearchBar from "@/components/SearchBar";
import { searchContent } from "@/lib/content";

type SearchPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const t = await getTranslations("search");

  const { data: results, error } = query
    ? await searchContent(query)
    : { data: null, error: null };

  return (
    <PageCard>
      <section className="space-y-5">
        <PageHeader
          title={t("button")}
          subtitle={query ? t("resultsFor", { query }) : t("empty")}
        />

        <SearchBar locale={locale as AppLocale} />

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        {query && results ? (
          results.length > 0 ? (
            <>
              <p className="text-xs text-ink-subtle">
                {results.length === 1
                  ? t("countOne")
                  : t("countMany", { count: results.length })}
              </p>
              <div className="space-y-3">
                {results.map((item) => (
                  <ContentCard key={item.id} item={item} locale={locale as AppLocale} />
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-muted">{t("noResults")}</p>
          )
        ) : null}
      </section>
    </PageCard>
  );
}
