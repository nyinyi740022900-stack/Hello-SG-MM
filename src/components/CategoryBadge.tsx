import { getTranslations } from "next-intl/server";
import type { ContentCategory } from "@/lib/content";

/**
 * Category colour is the portal's only visual coding for topic — we carry no
 * photography, because news images are copyrighted and hot-linking them is a
 * legal risk. So the palette has to do real work: related topics share a hue,
 * and the two categories a worker most needs to notice (scams, rights) take
 * the alert colour.
 */
const CATEGORY_STYLE: Record<ContentCategory, string> = {
  mom_policy: "bg-brand-soft text-brand-strong",
  embassy: "bg-brand-soft text-brand-strong",
  safety_scam: "bg-danger-soft text-danger",
  legal: "bg-danger-soft text-danger",
  finance: "bg-warning-soft text-warning",
  education: "bg-warning-soft text-warning",
  health: "bg-accent-soft text-accent",
  community: "bg-accent-soft text-accent",
  transport: "bg-brand-soft text-brand-strong",
  jobs: "bg-warning-soft text-warning",
  housing: "bg-accent-soft text-accent",
  cost_of_living: "bg-warning-soft text-warning",
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
