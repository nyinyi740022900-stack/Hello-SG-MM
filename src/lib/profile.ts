import { supabase } from "@/lib/supabase";
import { avatarUrl } from "@/lib/placeComments";

/**
 * Display fields a signed-in user may edit on their account page.
 *
 * Kept deliberately thin (name + avatar only) — see the place-comments
 * migration for why this app does not store phone, employer or dormitory.
 */

export type EditableProfile = {
  id: string;
  email: string;
  role: "user" | "agency" | "admin";
  display_name: string | null;
  avatar_path: string | null;
};

const PROFILE_COLUMNS = "id,email,role,display_name,avatar_path";
const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export { avatarUrl };

export function initialsFor(displayName: string | null | undefined, email?: string | null): string {
  const name = displayName?.trim();
  if (name) {
    const parts = name.split(/\s+/).slice(0, 2);
    return parts.map((p) => [...p][0] ?? "").join("").toUpperCase() || "?";
  }
  return email?.slice(0, 1).toUpperCase() || "?";
}

export function validateDisplayName(raw: string): string | null {
  const name = raw.trim();
  if (name.length === 0) return null; // clearing the name is allowed
  if (name.length < 2 || name.length > 40) {
    return "Name must be between 2 and 40 characters.";
  }
  return null;
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function fetchEditableProfile(
  userId: string,
): Promise<{ data: EditableProfile | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle<EditableProfile>();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function updateDisplayName(
  userId: string,
  displayName: string,
): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const validationError = validateDisplayName(displayName);
  if (validationError) {
    return { error: validationError };
  }

  const trimmed = displayName.trim();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: trimmed.length === 0 ? null : trimmed })
    .eq("id", userId);

  return { error: error?.message ?? null };
}

export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<{ path: string | null; error: string | null }> {
  if (!supabase) {
    return { path: null, error: "Supabase is not configured." };
  }

  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    return { path: null, error: "Use a JPG, PNG, WebP or GIF image." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { path: null, error: "Photo must be 2 MB or smaller." };
  }

  const safeFilename = sanitizeFilename(file.name || "avatar.jpg");
  const storagePath = `${userId}/${Date.now()}-${safeFilename}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    return { path: null, error: uploadError.message };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_path: storagePath })
    .eq("id", userId);

  if (updateError) {
    return { path: null, error: updateError.message };
  }

  return { path: storagePath, error: null };
}

export async function clearAvatar(userId: string): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_path: null })
    .eq("id", userId);

  return { error: error?.message ?? null };
}
