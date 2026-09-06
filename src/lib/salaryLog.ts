import { supabase } from "@/lib/supabase";

export type SalaryEntry = {
  id: string;
  user_id: string;
  entry_date: string;
  expected_amount: number;
  received_amount: number;
  currency: string;
  note: string | null;
  created_at: string;
};

export type SalaryEntryInput = {
  entryDate: string;
  expectedAmount: number;
  receivedAmount: number;
  currency: string;
  note?: string;
};

export type SalaryLogSummary = {
  totalExpected: number;
  totalReceived: number;
  totalShortfall: number;
  entryCount: number;
  shortfallCount: number;
};

/** Summarize a list of salary entries into totals. Pure function — no I/O. */
export function summarizeSalaryEntries(
  entries: Pick<SalaryEntry, "expected_amount" | "received_amount">[],
): SalaryLogSummary {
  let totalExpected = 0;
  let totalReceived = 0;
  let shortfallCount = 0;

  for (const entry of entries) {
    totalExpected += entry.expected_amount;
    totalReceived += entry.received_amount;
    if (entry.received_amount < entry.expected_amount) {
      shortfallCount += 1;
    }
  }

  return {
    totalExpected: round2(totalExpected),
    totalReceived: round2(totalReceived),
    totalShortfall: round2(totalExpected - totalReceived),
    entryCount: entries.length,
    shortfallCount,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function listSalaryEntries(
  userId: string,
): Promise<{ data: SalaryEntry[] | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("salary_entries")
    .select("id,user_id,entry_date,expected_amount,received_amount,currency,note,created_at")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .returns<SalaryEntry[]>();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? [], error: null };
}

export async function addSalaryEntry(
  userId: string,
  input: SalaryEntryInput,
): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase.from("salary_entries").insert({
    user_id: userId,
    entry_date: input.entryDate,
    expected_amount: input.expectedAmount,
    received_amount: input.receivedAmount,
    currency: input.currency,
    note: input.note?.trim() || null,
  });

  return { error: error?.message ?? null };
}

export async function deleteSalaryEntry(entryId: string): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { error } = await supabase.from("salary_entries").delete().eq("id", entryId);

  return { error: error?.message ?? null };
}
