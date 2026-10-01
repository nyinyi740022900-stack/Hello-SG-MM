import { PageHeader } from "@/components/ui/Card";
import AdminUsersPanel from "@/components/AdminUsersPanel";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return (
    <section className="space-y-5">
      <PageHeader
        title="Users / အသုံးပြုသူများ"
        subtitle="Everyone registered in the app. / App ထဲ register လုပ်ထားသူအားလုံး။"
      />
      <AdminUsersPanel />
    </section>
  );
}
