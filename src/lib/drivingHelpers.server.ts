import { createClient } from "@supabase/supabase-js";
import {
  DRIVING_HELPER_COLUMNS,
  type DrivingHelperRow,
} from "@/lib/drivingHelpers";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Active helpers for the public driving-licence page. */
export async function listActiveDrivingHelpers(): Promise<DrivingHelperRow[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data, error } = await db
    .from("driving_helpers")
    .select(DRIVING_HELPER_COLUMNS)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<DrivingHelperRow[]>();

  if (error) {
    console.error("[listActiveDrivingHelpers]", error.message);
    return [];
  }

  return data ?? [];
}

/** All helpers for admin panel. */
export async function getAdminDrivingHelpers(): Promise<DrivingHelperRow[]> {
  const db = serviceClient();
  if (!db) return [];

  const { data, error } = await db
    .from("driving_helpers")
    .select(DRIVING_HELPER_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<DrivingHelperRow[]>();

  if (error) {
    console.error("[getAdminDrivingHelpers]", error.message);
    return [];
  }

  return data ?? [];
}
