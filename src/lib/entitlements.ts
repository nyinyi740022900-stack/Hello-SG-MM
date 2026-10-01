import { supabase } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Product codes for premium features.
 */
export const PRODUCT_CODES = {
  PASSPORT_RENEWAL_PDF: "passport_renewal_pdf_export",
  SALARY_EVIDENCE_PDF: "salary_evidence_pdf_export",
} as const;

export type ProductCode = (typeof PRODUCT_CODES)[keyof typeof PRODUCT_CODES];

/**
 * Shape of an entitlement row from the database.
 */
export type EntitlementRow = {
  id: string;
  user_id: string;
  product_code: string;
  total_exports: number;
  used_exports: number;
  expires_at: string | null;
  source_payment_id: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Summary of user entitlements for a specific product.
 */
export type EntitlementSummary = {
  productCode: ProductCode;
  totalExports: number;
  usedExports: number;
  remainingExports: number;
  expiresAt: Date | null;
  isValid: boolean;
};

type MinimalEntitlementRow = Pick<
  EntitlementRow,
  "id" | "total_exports" | "used_exports" | "expires_at"
>;

/**
 * Summarize entitlement rows into a single product-level balance.
 * Exported for deterministic tests.
 */
export function summarizeEntitlements(
  rows: MinimalEntitlementRow[],
  productCode: ProductCode,
  now: Date = new Date(),
): EntitlementSummary {
  if (!rows.length) {
    return {
      productCode,
      totalExports: 0,
      usedExports: 0,
      remainingExports: 0,
      expiresAt: null,
      isValid: false,
    };
  }

  let totalExports = 0;
  let usedExports = 0;
  let latestExpiry: Date | null = null;

  for (const row of rows) {
    const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
    if (expiresAt && expiresAt < now) {
      continue;
    }
    totalExports += row.total_exports;
    usedExports += row.used_exports;
    if (expiresAt && (!latestExpiry || expiresAt > latestExpiry)) {
      latestExpiry = expiresAt;
    }
  }

  const remainingExports = Math.max(0, totalExports - usedExports);

  return {
    productCode,
    totalExports,
    usedExports,
    remainingExports,
    expiresAt: latestExpiry,
    isValid: remainingExports > 0,
  };
}

/**
 * Fetch a user's entitlement summary for a given product code.
 * Aggregates all entitlements for the product and checks validity.
 */
export async function getUserEntitlementSummary(
  userId: string,
  productCode: ProductCode,
): Promise<{ data: EntitlementSummary | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("export_entitlements")
    .select("id,total_exports,used_exports,expires_at")
    .eq("user_id", userId)
    .eq("product_code", productCode)
    .returns<MinimalEntitlementRow[]>();

  if (error) {
    return { data: null, error: error.message };
  }

  return {
    data: summarizeEntitlements(data ?? [], productCode),
    error: null,
  };
}

/**
 * Atomically consume one entitlement export for a user.
 * Uses a SECURITY DEFINER RPC function to guarantee consistency.
 */
export async function consumeExportEntitlement(params: {
  supabaseClient: SupabaseClient;
  userId: string;
  productCode: ProductCode;
}): Promise<{ consumed: boolean; entitlementId: string | null; error: string | null }> {
  const { data, error } = await params.supabaseClient.rpc("consume_export_entitlement", {
    p_user_id: params.userId,
    p_product_code: params.productCode,
  });

  if (error) {
    return { consumed: false, entitlementId: null, error: error.message };
  }

  const entitlementId = typeof data === "string" ? data : null;
  if (!entitlementId) {
    return { consumed: false, entitlementId: null, error: null };
  }

  return { consumed: true, entitlementId, error: null };
}

/**
 * Create an entitlement for a user after payment approval.
 * This should only be called by admin actions.
 */
export async function createEntitlement(
  params: {
    userId: string;
    productCode: ProductCode;
    totalExports: number;
    sourcePaymentId: string;
    expiresAt?: Date;
  },
  client: SupabaseClient | null = supabase,
): Promise<{ entitlementId: string | null; error: string | null }> {
  if (!client) {
    return { entitlementId: null, error: "Supabase is not configured." };
  }

  const { data, error } = await client
    .from("export_entitlements")
    .insert({
      user_id: params.userId,
      product_code: params.productCode,
      total_exports: params.totalExports,
      used_exports: 0,
      source_payment_id: params.sourcePaymentId,
      expires_at: params.expiresAt?.toISOString() ?? null,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    return { entitlementId: null, error: error.message };
  }

  return { entitlementId: data?.id ?? null, error: null };
}

/**
 * Fetch all entitlements for a user (for account page display).
 */
export async function getUserEntitlements(
  userId: string,
): Promise<{ data: EntitlementRow[] | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("export_entitlements")
    .select(
      "id,user_id,product_code,total_exports,used_exports,expires_at,source_payment_id,created_at,updated_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<EntitlementRow[]>();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? [], error: null };
}
