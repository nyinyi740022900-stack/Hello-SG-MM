import { getTranslations } from "next-intl/server";
import { PASSPORT_FORM_DOWNLOAD_PATHS } from "@/lib/passportForms";
import { Card } from "@/components/ui/Card";

const LINK_CLASS =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand";

export default async function PassportFormDownloads() {
  const t = await getTranslations("formDownloads");

  return (
    <Card className="space-y-3">
      <div>
        <p className="font-semibold text-ink">{t("title")}</p>
        <p className="mt-1 text-xs text-ink-subtle">{t("hint")}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <a href={PASSPORT_FORM_DOWNLOAD_PATHS.general} download className={LINK_CLASS}>
          📄 {t("generalButton")}
        </a>
        <a href={PASSPORT_FORM_DOWNLOAD_PATHS.maid} download className={LINK_CLASS}>
          📄 {t("maidButton")}
        </a>
      </div>
    </Card>
  );
}
