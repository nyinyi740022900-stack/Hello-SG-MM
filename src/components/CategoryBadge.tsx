import { getTranslations } from "next-intl/server";
import type { ContentCategory } from "@/lib/content";

/**
 * Category colour is the portal's only visual coding for topic — we carry no
 * photography, because news images are copyrighted and hot-linking them is a
 * legal risk. So the palette has to do real work: related topics share a hue,
 * and Safety (scams + rights) takes the alert colour.
 */
const CATEGORY_STYLE: Record<ContentCategory, string> = {
  work: "bg-brand-soft text-brand-strong",
  money: "bg-warning-soft text-warning",
  safety: "bg-danger-soft text-danger",
  health: "bg-accent-soft text-accent",
  housing: "bg-accent-soft text-accent",
  community: "bg-brand-soft text-brand-strong",
};

export default async function CategoryBadge({
  category,
  className = "",
}: {
  category: ContentCategory;
  className?: string;
}) {
  const t = await getTranslations("news");

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[category]} ${className}`}
    >
      {t(`category.${category}`)}
    </span>
  );
}

export { CATEGORY_STYLE };
