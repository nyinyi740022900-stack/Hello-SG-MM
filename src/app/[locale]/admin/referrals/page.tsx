import { PageHeader } from "@/components/ui/Card";
import AdminReferralLinksPanel from "@/components/AdminReferralLinksPanel";
import { getAdminReferralLinks } from "@/lib/referralLinks.server";

export const dynamic = "force-dynamic";

/**
 * Admin: affiliate + invitation URLs for Exchange, Travel, and Accounts Guide.
 * Organised by app menu category. Paste tracking URLs when partners approve.
 */
export default async function AdminReferralsPage() {
  const links = await getAdminReferralLinks();

  return (
    <section className="space-y-5">
      <PageHeader
        title="Referral income links"
        subtitle="Manage partners by app menu: Exchange (remittance), Travel (hotels / eSIM / card), Accounts Guide. When you get a tracking URL, open the partner → Paste tracking URL → save as Affiliate."
      />
      <AdminReferralLinksPanel initialLinks={links} />
    </section>
  );
}
