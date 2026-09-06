import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { PageHeader, Card } from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";
import CategoryBadge from "@/components/CategoryBadge";
import { routing } from "@/i18n/routing";
import { getContentBySlug } from "@/lib/content";
import PageCard from "@/components/ui/PageCard";

async function loadItem(slug: string) {
  const { data } = await getContentBySlug(slug);
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const isMy = locale === "my";
  const t = await getTranslations("news");

  const item = await loadItem(slug);
  if (!item) {
    return { title: t("notFoundTitle") };
  }

  const title = isMy ? item.title_my : item.title_en;
  const summary = isMy ? item.summary_my : item.summary_en;

  return {
    title,
    description: summary ?? undefined,
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const isMy = locale === "my";

  const t = await getTranslations("news");
  const item = await loadItem(slug);

  if (!item) {
    return (
      <PageCard>
        <section className="space-y-5">
          <PageHeader eyebrow={t("badge")} title={t("notFoundTitle")} />
          <Card className="space-y-3 text-sm text-ink-muted">
            <p>{t("notFoundBody")}</p>
            <Link href="/news" className="inline-flex text-sm font-medium text-brand-strong underline">
              {t("backToNews")}
            </Link>
          </Card>
        </section>
      </PageCard>
    );
  }

  const title = isMy ? item.title_my : item.title_en;
  const summary = isMy ? item.summary_my : item.summary_en;
  const body = isMy ? item.body_my : item.body_en;

  let sourceHost: string | null = null;
  if (item.source_url) {
    try {
      sourceHost = new URL(item.source_url).host;
    } catch {
      sourceHost = item.source_url;
    }
  }

  return (
    <PageCard>
      <section className="space-y-5">
        <Link href="/news" className="inline-flex text-sm font-medium text-brand-strong underline">
          {t("backToNews")}
        </Link>

        <div className="max-w-prose space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={item.category} />
            {item.published_at ? (
              <span className="text-xs text-ink-subtle">
                {t("publishedOn", {
                  date: new Date(item.published_at).toLocaleDateString(isMy ? "my-MM" : "en-SG", {
                    dateStyle: "medium",
                  }),
                })}
              </span>
            ) : null}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>

          {summary ? <p className="text-lg text-ink-muted">{summary}</p> : null}

          <div className="whitespace-pre-line text-ink">{body}</div>

          {item.source_url ? (
            <p className="pt-2 text-sm text-ink-subtle">
              {t("sourceLabel")}:{" "}
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-strong underline"
              >
                {item.source_name ?? sourceHost}
              </a>
            </p>
          ) : null}
        </div>

        <Link href="/news" className="inline-flex text-sm font-medium text-brand-strong underline">
          {t("backToNews")}
        </Link>
      </section>
    </PageCard>
  );
}
