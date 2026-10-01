import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { createEntitlement, PRODUCT_CODES } from "@/lib/entitlements";
import { logServerEvent } from "@/lib/serverLogger";

// ---------------------------------------------------------------------------
// Profile types and fetching (for admin role checks)
// ---------------------------------------------------------------------------

export type UserProfileRole = "user" | "agency" | "admin";

export type UserProfileData = {
  id: string;
  email: string;
  role: UserProfileRole;
};

/**
 * Fetch the current user's profile from the profiles table.
 * Use this for secure role checks instead of raw_user_meta_data.
 *
 * @param userId - The user's UUID
 * @returns Profile data or null if not found
 */
export async function fetchUserProfile(
  userId: string
): Promise<{ data: UserProfileData | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", userId)
    .single<UserProfileData>();

  if (error) {
    // PGRST116 = no rows returned (profile not found)
    if (error.code === "PGRST116") {
      return { data: null, error: null };
    }
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// ---------------------------------------------------------------------------
// Payment types and functions
// ---------------------------------------------------------------------------

export type ManualPaymentInput = {
  userId: string;
  method: "kpay" | "wavepay";
  amount: number;
  currency: "SGD" | "USD";
  purpose: string;
  transactionReference: string;
  receiptPath: string;
  note: string;
};

export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded";

export type PendingPaymentRow = {
  id: string;
  user_id: string;
  type: "kpay" | "wavepay" | "stripe" | "manual";
  amount: number;
  currency: string;
  purpose: string;
  reference_id: string | null;
  receipt_path: string | null;
  status: PaymentStatus;
  admin_note: string | null;
  created_at: string;
};

export type UserPaymentRow = {
  id: string;
  type: "kpay" | "wavepay" | "stripe" | "manual";
  amount: number;
  currency: string;
  purpose: string;
  reference_id: string | null;
  status: PaymentStatus;
  admin_note: string | null;
  created_at: string;
};

const PAYMENT_RECEIPT_BUCKET = "payment-receipts";

function isHttpUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function submitManualPayment(input: ManualPaymentInput) {
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase.from("payments").insert({
    user_id: input.userId,
    type: input.method,
    amount: input.amount,
    currency: input.currency,
    purpose: input.purpose,
    reference_id: input.transactionReference,
    receipt_path: input.receiptPath,
    admin_note: input.note,
    status: "pending",
  });

  return { error: error?.message ?? null };
}

export async function uploadPaymentReceipt(userId: string, file: File) {
  if (!supabase) {
    return { path: null, error: "Supabase is not configured." };
  }

  const safeFilename = sanitizeFilename(file.name);
  const storagePath = `${userId}/${Date.now()}-${safeFilename}`;

  const { error } = await supabase.storage
    .from(PAYMENT_RECEIPT_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (error) {
    return { path: null, error: error.message };
  }

  return { path: storagePath, error: null };
}

export async function resolveReceiptAccessUrl(receiptPath: string) {
  if (!supabase) {
    return { url: null, error: "Supabase is not configured." };
  }

  if (isHttpUrl(receiptPath)) {
    return { url: receiptPath, error: null };
  }

  const { data, error } = await supabase.storage
    .from(PAYMENT_RECEIPT_BUCKET)
    .createSignedUrl(receiptPath, 60 * 30);

  if (error) {
    return { url: null, error: error.message };
  }

  return { url: data.signedUrl, error: null };
}

export async function fetchPendingPayments() {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("payments")
    .select(
      "id,user_id,type,amount,currency,purpose,reference_id,receipt_path,status,admin_note,created_at",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .returns<PendingPaymentRow[]>();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function fetchUserPayments(userId: string, limit = 10) {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("payments")
    .select("id,type,amount,currency,purpose,reference_id,status,admin_note,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<UserPaymentRow[]>();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Map of payment purposes to their corresponding product codes for entitlement creation.
 */
const PURPOSE_TO_PRODUCT_CODE: Record<string, string> = {
  passport_renewal_pdf_export: PRODUCT_CODES.PASSPORT_RENEWAL_PDF,
  passport_renewal: PRODUCT_CODES.PASSPORT_RENEWAL_PDF, // Alias for backwards compatibility
};

/**
 * Review a pending payment and optionally create entitlements on approval.
 */
export async function reviewPayment(
  paymentId: string,
  status: "completed" | "failed",
  adminNote: string,
  client: SupabaseClient | null = supabase,
  // A service-role client has no browser session for client.auth.getUser(),
  // so a server route authorizing via checkAdminAuth() must pass the admin's
  // id explicitly instead.
  approvedByUserId?: string,
): Promise<{ error: string | null; entitlementCreated: boolean }> {
  if (!client) {
    return { error: "Supabase is not configured.", entitlementCreated: false };
  }

  // First, fetch the payment to get user_id, purpose, and reference (e.g. job id)
  const { data: payment, error: fetchError } = await client
    .from("payments")
    .select("id,user_id,purpose,reference_id,status")
    .eq("id", paymentId)
    .single<{
      id: string;
      user_id: string;
      purpose: string;
      reference_id: string | null;
      status: string;
    }>();

  if (fetchError || !payment) {
    logServerEvent("warn", "payment_review_not_found", {
      paymentId,
      status,
      reason: fetchError?.message ?? "missing",
    });
    return { error: fetchError?.message ?? "Payment not found.", entitlementCreated: false };
  }

  // Prevent re-reviewing already processed payments
  if (payment.status !== "pending") {
    return { error: `Payment already has status: ${payment.status}`, entitlementCreated: false };
  }

  const payload: {
    status: "completed" | "failed";
    admin_note: string;
    approved_at?: string;
    approved_by?: string;
  } = {
    status,
    admin_note: adminNote,
  };

  if (status === "completed") {
    if (approvedByUserId) {
      payload.approved_by = approvedByUserId;
      payload.approved_at = new Date().toISOString();
    } else {
      const { data: userData } = await client.auth.getUser();
      if (userData.user) {
        payload.approved_by = userData.user.id;
        payload.approved_at = new Date().toISOString();
      }
    }
  }

  const { error: updateError } = await client
    .from("payments")
    .update(payload)
    .eq("id", paymentId);

  if (updateError) {
    logServerEvent("error", "payment_review_update_failed", {
      paymentId,
      status,
      reason: updateError.message,
    });
    return { error: updateError.message, entitlementCreated: false };
  }

  // If approved, create entitlement and/or activate product side-effects
  let entitlementCreated = false;
  if (status === "completed") {
    const productCode = PURPOSE_TO_PRODUCT_CODE[payment.purpose];
    if (productCode) {
      // Create entitlement with 1 export, no expiry
      const { error: entitlementError } = await createEntitlement(
        {
          userId: payment.user_id,
          productCode: productCode as typeof PRODUCT_CODES.PASSPORT_RENEWAL_PDF,
          totalExports: 1,
          sourcePaymentId: paymentId,
        },
        client,
      );

      if (entitlementError) {
        logServerEvent("error", "payment_review_entitlement_failed", {
          paymentId,
          userId: payment.user_id,
          reason: entitlementError,
        });
        return {
          error:
            "Payment status updated, but entitlement creation failed. Please retry entitlement creation.",
          entitlementCreated: false,
        };
      } else {
        entitlementCreated = true;
      }
    }

    // Featured job boost: reference_id must be the job_listings.id
    if (payment.purpose === "job_featured" && payment.reference_id) {
      const { activateJobFeaturedFromPayment } = await import(
        "@/lib/jobListings.server"
      );
      const { featuredUntilFromNow } = await import("@/lib/jobListings");
      const { error: featuredError } = await activateJobFeaturedFromPayment({
        jobId: payment.reference_id,
        featuredUntilIso: featuredUntilFromNow(),
      });
      if (featuredError) {
        logServerEvent("error", "payment_review_job_featured_failed", {
          paymentId,
          jobId: payment.reference_id,
          reason: featuredError,
        });
        return {
          error:
            "Payment approved, but Featured boost failed to activate. Retry from admin jobs.",
          entitlementCreated,
        };
      }
    }
  }

  return { error: null, entitlementCreated };
}
