import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let browserSupabaseClient: SupabaseClient | null = null;

function createSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}

/**
 * Shared browser Supabase client singleton.
 * Keeps auth/session behavior consistent with SSR middleware cookies.
 */
export const supabase =
  browserSupabaseClient ?? (browserSupabaseClient = createSupabaseBrowserClient());
