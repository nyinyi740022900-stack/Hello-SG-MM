import { supabase } from "@/lib/supabase";

/**
 * Ad Event Types
 * - 'impression': User saw the ad
 * - 'click': User clicked the ad
 */
export type AdEventType = "impression" | "click";

/**
 * Sponsor Inquiry Status
 * - 'new': Just submitted
 * - 'contacted': Admin reached out
 * - 'closed': Inquiry resolved
 */
export type SponsorInquiryStatus = "new" | "contacted" | "closed";

/**
 * Input for tracking an ad event
 */
export type AdEventInput = {
  /** User ID if authenticated, null for anonymous users */
  userId: string | null;
  /** Where the ad is displayed (e.g., 'home_banner', 'guide_sidebar') */
  placement: string;
  /** Type of event: 'impression' or 'click' */
  eventType: AdEventType;
  /** URL the ad links to */
  targetUrl: string;
};

/**
 * Input for sponsor inquiry submission
 */
export type SponsorInquiryInput = {
  /** Contact person name */
  name: string;
  /** Company or organization name */
  organization: string;
  /** Contact email */
  email: string;
  /** Contact phone (optional) */
  phone?: string;
  /** Message or inquiry details */
  message: string;
};

/**
 * Track an ad impression event.
 * Call this when an ad becomes visible to the user.
 *
 * @param input - Ad event details
 * @returns Error message if failed, null if successful
 */
export async function trackAdImpression(
  input: Omit<AdEventInput, "eventType">,
): Promise<{ error: string | null }> {
  return trackAdEvent({ ...input, eventType: "impression" });
}

/**
 * Track an ad click event.
 * Call this when a user clicks on an ad.
 *
 * @param input - Ad event details
 * @returns Error message if failed, null if successful
 */
export async function trackAdClick(
  input: Omit<AdEventInput, "eventType">,
): Promise<{ error: string | null }> {
  return trackAdEvent({ ...input, eventType: "click" });
}

/**
 * Internal function to track ad events.
 * Handles both impressions and clicks.
 */
async function trackAdEvent(input: AdEventInput): Promise<{ error: string | null }> {
  if (!supabase) {
    // Silently fail if Supabase not configured - don't block user experience
    console.warn("[monetization] Supabase not configured, skipping ad event tracking");
    return { error: null };
  }

  const { error } = await supabase.from("ad_events").insert({
    user_id: input.userId,
    placement: input.placement,
    event_type: input.eventType,
    target_url: input.targetUrl,
  });

  if (error) {
    console.error("[monetization] Failed to track ad event:", error.message);
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Submit a sponsor inquiry from a business interested in advertising.
 *
 * @param input - Sponsor inquiry details
 * @returns Error message if failed, null if successful
 */
export async function submitSponsorInquiry(
  input: SponsorInquiryInput,
): Promise<{ error: string | null }> {
  try {
    const response = await fetch("/api/sponsor-inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        website: "",
      }),
    });

    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => ({}));
      const message =
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof (payload as { error: unknown }).error === "string"
          ? (payload as { error: string }).error
          : "Failed to submit sponsor inquiry.";
      return { error: message };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected network error.";
    return { error: message };
  }

  return { error: null };
}
