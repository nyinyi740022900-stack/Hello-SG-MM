import { getTranslations } from "next-intl/server";
import { helperImageUrl, type DrivingHelperRow } from "@/lib/drivingHelpers";
import { Card } from "@/components/ui/Card";
import StatusMessage from "@/components/ui/StatusMessage";

type DrivingHelpersSectionProps = {
  helpers: DrivingHelperRow[];
  locale: string;
};

/**
 * Public cards for admin-managed free Myanmar driving helpers.
 */
export default async function DrivingHelpersSection({
  helpers,
  locale,
}: DrivingHelpersSectionProps) {
  if (helpers.length === 0) {
    return null;
  }

  const t = await getTranslations("drivingLicense");
  const isMy = locale === "my";

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="font-semibold text-ink">{t("helpersTitle")}</h3>
        <p className="mt-1 text-sm text-ink-muted">{t("helpersSubtitle")}</p>
      </div>

      <StatusMessage variant="warning">{t("helpersDisclaimer")}</StatusMessage>

      <ul className="space-y-4">
        {helpers.map((helper) => {
          const name = isMy ? helper.name_my : helper.name_en;
          const description = isMy
            ? helper.description_my || helper.description_en
            : helper.description_en || helper.description_my;
          const imageUrl = helperImageUrl(helper.image_path);
          const links: { label: string; href: string }[] = [];
          if (helper.facebook_url) {
            links.push({ label: t("helpersLinkFacebook"), href: helper.facebook_url });
          }
          if (helper.telegram_url) {
            links.push({ label: t("helpersLinkTelegram"), href: helper.telegram_url });
          }
          if (helper.whatsapp_url) {
            links.push({ label: t("helpersLinkWhatsapp"), href: helper.whatsapp_url });
          }
          if (helper.group_url) {
            links.push({ label: t("helpersLinkGroup"), href: helper.group_url });
          }
          if (helper.website_url) {
            links.push({ label: t("helpersLinkWebsite"), href: helper.website_url });
          }

          return (
            <li
              key={helper.id}
              className="overflow-hidden rounded-2xl border border-border bg-surface-muted"
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt=""
                  className="h-40 w-full object-cover sm:h-44"
                />
              ) : null}
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold text-ink">{name}</h4>
                  {helper.is_free ? (
                    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-strong">
                      {t("helpersFreeBadge")}
                    </span>
                  ) : null}
                </div>
                {description ? (
                  <p className="text-sm text-ink-muted">{description}</p>
                ) : null}
                {links.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {links.map((link) => (
                      <li key={link.href + link.label}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink hover:bg-brand-soft"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
