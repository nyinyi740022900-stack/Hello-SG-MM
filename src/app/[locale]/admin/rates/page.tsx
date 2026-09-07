import { supabase } from "@/lib/supabase";
import AdminRateEntryForm from "@/components/AdminRateEntryForm";

/**
 * Admin surface for observed exchange rates.
 *
 * The daily cron already records mid-market rates for the rupee, yuan, taka
 * and ringgit. This page is for what a machine cannot fetch: a rate someone
 * read off a board or a provider's app — which for the kyat is the only kind
 * that tells a worker the truth.
 */

export const dynamic = "force-dynamic";

type RecentRate = {
  pair: string;
  rate: number;
  source_name: string | null;
  observed_at: string;
};

export default async function AdminRatesPage() {
  let recent: RecentRate[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("exchange_rates")
      .select("pair,rate,source_name,observed_at")
      .eq("provider", "market")
      .order("observed_at", { ascending: false })
      .limit(15)
      .returns<RecentRate[]>();
    recent = data ?? [];
  }

  return <AdminRateEntryForm recent={recent} />;
}
