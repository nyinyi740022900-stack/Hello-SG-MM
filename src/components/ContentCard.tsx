import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import CategoryBadge from "@/components/CategoryBadge";
import { contentImageUrl, type ContentItem } from "@/lib/content";
import type { AppLocale } from "@/i18n/routing";

/**
 * One item in a feed. Optional cover image when an admin uploaded one;
 * otherwise text-first with category pill hierarchy.
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
  const coverUrl = contentImageUrl(item.image_path);

  const isUrgent = item.priority === "urgent";

  return (
    <Link
      href={`/news/${item.slug ?? ""}`}
      locale={locale}
      className={[
        "block overflow-hidden rounded-2xl border bg-surface transition hover:border-brand-soft-border hover:bg-brand-soft",
        isUrgent ? "border-l-4 border-l-danger border-border" : "border-border",
      ].join(" ")}
    >
      {coverUrl ? (
        <span className="relative block aspect-[16/9] w-full bg-surface-muted">
          <Image
            src={coverUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            className="object-cover"
          />
        </span>
      ) : null}

      <span className="block p-4">
        <span className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={item.category} />
          {item.published_at ? (
            <span className="ml-auto text-xs text-ink-subtle">
              {new Date(item.published_at).toLocaleDateString(isMy ? "my-MM" : "en-SG", {
                dateStyle: "medium",
              })}
            </span>
          ) : null}
        </span>

        <h3 className="mt-2 font-semibold text-ink">{title}</h3>
        {preview ? (
          <p className="mt-1 line-clamp-3 text-sm text-ink-muted">{preview}</p>
        ) : null}

        {item.source_name ? (
          <p className="mt-2 text-xs text-ink-subtle">
            {t("sourceLabel")}: {item.source_name}
          </p>
        ) : null}
      </span>
    </Link>
  );
}
