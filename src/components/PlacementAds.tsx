import AdBanner from "@/components/AdBanner";
import { adImageUrl, type AdPlacement } from "@/lib/sponsoredAds";
import { listActiveAdsForPlacement } from "@/lib/sponsoredAds.server";

type PlacementAdsProps = {
  placement: AdPlacement;
};

/**
 * Loads active sponsored ads for a placement.
 * Returns null when empty so Google Ad slots (or nothing) can fill the gap —
 * no hardcoded "View Sponsors" fallback that points at owner income pages.
 */
export default async function PlacementAds({ placement }: PlacementAdsProps) {
  const ads = await listActiveAdsForPlacement(placement);

  if (ads.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {ads.map((ad) => (
        <AdBanner
          key={ad.id}
          placement={placement}
          sponsorName={ad.sponsor_name}
          headline={ad.title}
          description={ad.description ?? undefined}
          ctaText={ad.cta_label}
          targetUrl={ad.target_url}
          imageUrl={adImageUrl(ad.image_path)}
        />
      ))}
    </div>
  );
}
