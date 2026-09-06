import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import CategoryBadge from "@/components/CategoryBadge";
import type { ContentItem } from "@/lib/content";
import type { AppLocale } from "@/i18n/routing";

/**
 * One item in a feed. Text-first by necessity (no photography — see
 * CategoryBadge), so hierarchy comes from type weight and the category pill.
 * Urgent items get a left rule rather than a full red card, which would shout
 * over everything around it.
 */
export default async function ContentCard({
  item,
  locale,
}: {
  item: ContentItem;
  locale: AppLocale;
}) {
  const t = await getTranslations("news");
  const isMy = locale === "my";

  const title = isMy ? item.title_my : item.title_en;
  const summary = isMy ? item.summary_my : item.summary_en;
  const body = isMy ? item.body_my : item.body_en;
  const preview = summary ?? body;

  const isUrgent = item.priority === "urgent";

  return (
    <Link
      href={`/news/${item.slug ?? ""}`}
      locale={locale}
      className={[
        "block rounded-2xl border bg-surface p-4 transition hover:border-brand-soft-border hover:bg-brand-soft",
        isUrgent ? "border-l-4 border-l-danger border-border" : "border-border",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge category={item.category} />
        {item.published_at ? (
          <span className="ml-auto text-xs text-ink-subtle">
            {new Date(item.published_at).toLocaleDateString(isMy ? "my-MM" : "en-SG", {
              dateStyle: "medium",
            })}
          </span>
        ) : null}
      </div>

      <h3 className="mt-2 font-semibold text-ink">{title}</h3>
      {preview ? (
        <p className="mt-1 line-clamp-3 text-sm text-ink-muted">{preview}</p>
      ) : null}

      {item.source_name ? (
        <p className="mt-2 text-xs text-ink-subtle">
          {t("sourceLabel")}: {item.source_name}
        </p>
      ) : null}
    </Link>
  );
}
