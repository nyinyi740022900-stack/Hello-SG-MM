import { PageHeader } from "@/components/ui/Card";
import AdminDrivingHelpersPanel from "@/components/AdminDrivingHelpersPanel";
import { getAdminDrivingHelpers } from "@/lib/drivingHelpers.server";

export const dynamic = "force-dynamic";

/**
 * Admin CRUD for free Myanmar driving-licence community helpers.
 */
export default async function AdminDrivingHelpersPage() {
  const helpers = await getAdminDrivingHelpers();

  return (
    <section className="space-y-5">
      <PageHeader
        title="Driving helpers"
        subtitle="People or groups who give free Myanmar-language help with Singapore driving licences. Shown on the Driving licence guide."
      />
      <AdminDrivingHelpersPanel initialHelpers={helpers} />
    </section>
  );
}
