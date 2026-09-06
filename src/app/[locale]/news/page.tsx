import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader, Card } from "@/components/ui/Card";
import { routing } from "@/i18n/routing";
import { listPublishedContent, type ContentCategory } from "@/lib/content";

const CATEGORY_STYLE: Record<ContentCategory, string> = {
  mom_policy: "bg-brand-soft text-brand-strong",
  embassy: "bg-brand-soft text-brand-strong",
  safety_scam: "bg-danger-soft text-danger",
  finance: "bg-warning-soft text-warning",
  legal: "bg-danger-soft text-danger",
  health: "bg-accent-soft text-accent",
  community: "bg-accent-soft text-accent",
  education: "bg-warning-soft text-warning",
};

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  const isMy = locale === "my";
  const t = await getTranslations("news");

  const { data: items, error } = await listPublishedContent();

  return (
    <section className="space-y-5">
      <PageHeader eyebrow={t("badge")} title={t("title")} subtitle={t("subtitle")} />

      {error ? (
        <Card className="text-sm text-danger">{error}</Card>
      ) : !items || items.length === 0 ? (
        <Card className="text-sm text-ink-muted">{t("empty")}</Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[item.category]}`}>
                  {t(`category.${item.category}`)}
                </span>
                {item.published_at ? (
                  <span className="text-xs text-ink-subtle">
                    {new Date(item.published_at).toLocaleDateString(isMy ? "my-MM" : "en-SG", {
                      dateStyle: "medium",
                    })}
                  </span>
                ) : null}
              </div>
              <h3 className="font-semibold text-ink">{isMy ? item.title_my : item.title_en}</h3>
              <p className="text-sm text-ink-muted">{isMy ? item.body_my : item.body_en}</p>
              {item.source_url ? (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-xs font-medium text-brand-strong underline"
                >
                  {t("sourceLink")}
                </a>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-ink-subtle">{t("disclaimer")}</p>
    </section>
  );
}
