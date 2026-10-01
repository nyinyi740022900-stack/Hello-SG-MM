import { supabase } from "@/lib/supabase";

export type UserProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  role: "user" | "agency" | "admin";
  created_at: string;
};

/**
 * List every registered user for the admin panel.
 *
 * Reads straight from the browser client rather than through a service-role
 * API route: the "Admins can view all profiles" RLS policy on `profiles`
 * already scopes this to admins, the same way the Sponsor Leads KPI reads
 * sponsor inquiries directly.
 */
export async function fetchAllUsers(): Promise<{
  data: UserProfileRow[] | null;
  error: string | null;
}> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,display_name,role,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as UserProfileRow[], error: null };
}
