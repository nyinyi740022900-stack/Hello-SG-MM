import { PageHeader } from "@/components/ui/Card";
import AdminCommentsPanel from "@/components/AdminCommentsPanel";
import { getAdminCommentReports } from "@/lib/pageComments.server";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage() {
  const reports = await getAdminCommentReports();

  return (
    <section className="space-y-5">
      <PageHeader
        title="Comment moderation"
        subtitle="Review reported comments. Delete removes them from public pages; Dismiss keeps the comment and closes the report."
      />
      <AdminCommentsPanel initialReports={reports} />
    </section>
  );
}
