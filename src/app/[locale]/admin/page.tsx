import { redirect } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

type AdminIndexPageProps = {
  params: Promise<{ locale: string }>;
};

/**
 * Bare /admin has no content of its own — redirect to the default admin
 * sub-page. The [locale]/admin/layout.tsx guard runs first and handles
 * auth/role checks before this redirect fires.
 */
export default async function AdminIndexPage({ params }: AdminIndexPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    redirect("/en/admin/payments");
  }
  redirect(`/${locale}/admin/payments`);
}
