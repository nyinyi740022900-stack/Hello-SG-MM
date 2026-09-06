/**
 * Server-side authorization helpers for admin access control.
 * Uses profiles.role instead of raw_user_meta_data for security.
 *
 * Usage in Server Components / Route Handlers:
 *   import { getServerUser, isAdminByProfile } from "@/lib/authz";
 *
 *   const user = await getServerUser();
 *   const isAdmin = await isAdminByProfile();
 */

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Environment variables for Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Check if Supabase is configured on the server
 */
export const isSupabaseConfiguredServer = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Create a Supabase client for Server Components (read-only cookies).
 * This client is safe to use in Server Components and Route Handlers.
 */
export async function createServerSupabaseClient() {
  if (!isSupabaseConfiguredServer) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        // Server Components can't set cookies directly
        // This is handled by middleware or route handlers
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Ignore - can't set cookies in Server Components
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Ignore - can't remove cookies in Server Components
        }
      },
    },
  });
}

/**
 * Get the authenticated user from server-side session.
 * Returns null if not authenticated or Supabase not configured.
 */
export async function getServerUser() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return null;
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Profile data returned from the profiles table.
 */
export type UserProfile = {
  id: string;
  email: string;
  role: "user" | "agency" | "admin";
  created_at: string;
  updated_at: string;
};

/**
 * Get user profile from the profiles table.
 * Returns null if not found or not authenticated.
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, role, created_at, updated_at")
      .eq("id", user.id)
      .single();

    if (error || !data) {
      return null;
    }

    return data as UserProfile;
  } catch {
    return null;
  }
}

/**
 * Check if the current authenticated user is an admin.
 * Uses profiles.role (secure) instead of raw_user_meta_data (insecure).
 *
 * @returns true if user is admin by profile role, false otherwise
 */
export async function isAdminByProfile(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.role === "admin";
}

/**
 * Authorization result for admin routes.
 */
export type AdminAuthResult =
  | { status: "not_configured" }
  | { status: "not_authenticated"; userId: null }
  | { status: "not_admin"; userId: string; role: string }
  | { status: "authorized"; userId: string; profile: UserProfile };

/**
 * Comprehensive admin authorization check.
 * Returns detailed status for different guard scenarios.
 *
 * @returns AdminAuthResult with status and user info
 */
export async function checkAdminAuth(): Promise<AdminAuthResult> {
  if (!isSupabaseConfiguredServer) {
    return { status: "not_configured" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { status: "not_configured" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "not_authenticated", userId: null };
  }

  const profile = await getUserProfileById(user.id);
  if (!profile || profile.role !== "admin") {
    return {
      status: "not_admin",
      userId: user.id,
      role: profile?.role ?? "unknown",
    };
  }

  return {
    status: "authorized",
    userId: user.id,
    profile,
  };
}

/**
 * Fetch profile for a specific user id (server-side).
 */
export async function getUserProfileById(userId: string): Promise<UserProfile | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as UserProfile;
}

