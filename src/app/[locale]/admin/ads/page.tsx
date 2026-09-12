import { PageHeader } from "@/components/ui/Card";
import AdminAdsPanel from "@/components/AdminAdsPanel";
import { getAdminSponsoredAds } from "@/lib/sponsoredAds.server";

export const dynamic = "force-dynamic";

/**
 * Admin surface for sponsored banners (image, title, details, link, placement).
 */
export default async function AdminAdsPage() {
  const ads = await getAdminSponsoredAds();

  return (
    <section className="space-y-5">
      <PageHeader
        title="Sponsored Ads"
        subtitle="Create banners with an image, title, details and link. Place them on Home or Passport Guide."
      />
      <AdminAdsPanel initialAds={ads} />
    </section>
  );
}
