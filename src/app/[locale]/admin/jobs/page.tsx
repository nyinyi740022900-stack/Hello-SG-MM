import { PageHeader } from "@/components/ui/Card";
import AdminJobListingsPanel from "@/components/AdminJobListingsPanel";
import { listAdminJobListings } from "@/lib/jobListings.server";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  const listings = await listAdminJobListings();

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Job listings"
        subtitle="Approve agency job posts. Reject fee-upfront scams. Featured boost activates when a job_featured payment is approved."
      />
      <AdminJobListingsPanel initialListings={listings} />
    </section>
  );
}
