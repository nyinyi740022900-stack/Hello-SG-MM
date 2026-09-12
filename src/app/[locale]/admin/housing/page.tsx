import { PageHeader } from "@/components/ui/Card";
import AdminRoomListingsPanel from "@/components/AdminRoomListingsPanel";
import { listAdminRoomListings } from "@/lib/roomListings.server";

export const dynamic = "force-dynamic";

export default async function AdminHousingPage() {
  const listings = await listAdminRoomListings();

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Housing listings"
        subtitle="Approve user-posted rooms. Reject scams and anything asking for passport/FIN. Published listings expire after 45 days."
      />
      <AdminRoomListingsPanel initialListings={listings} />
    </section>
  );
}
