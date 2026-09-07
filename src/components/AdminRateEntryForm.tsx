"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES, type CountryCode } from "@/lib/countries";
import StatusMessage from "@/components/ui/StatusMessage";

/**
 * Records a rate an admin has actually seen quoted.
 *
 * Deliberately not a general-purpose editor. Everything about it pushes toward
 * one habit: read a real quote, type it, say where it came from. There is no
 * way to backdate a reading and no way to save one without a source, because a
 * rate whose origin nobody can check is the failure this table was built to
 * prevent.
 */
export default function AdminRateEntryForm({
  recent,
}: {
  recent: { pair: string; rate: number; source_name: string | null; observed_at: string }[];
}) {
  const router = useRouter();

  const [country, setCountry] = useState<CountryCode>("mm");
  const [rate, setRate] = useState("");
  const [rateSell, setRateSell] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const selected = COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setState("saving");
    setMessage(null);

    try {
      const response = await fetch("/api/admin/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          rate,
          rateSell: rateSell || undefined,
          sourceName,
          sourceUrl: sourceUrl || undefined,
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        setState("error");
        setMessage(body.error ?? "Could not save.");
        return;
      }

      setState("saved");
      setMessage(body.warning ?? null);
      setRate("");
      setRateSell("");
      router.refresh();
    } catch {
      setState("error");
      setMessage("Could not reach the server.");
    }
  };

  const field =
    "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold text-ink">Record a money-changer rate</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Type a rate you have actually seen quoted — a changer&apos;s board, a
          provider&apos;s app, a bank page. This is the only source for the kyat:
          every public feed carries Myanmar&apos;s official rate, which is around
          half what a remittance really converts at.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Country</span>
          <select
            value={country}
            onChange={(event) => setCountry(event.target.value as CountryCode)}
            className={field}
          >
            {COUNTRIES.map((option) => (
              <option key={option.code} value={option.code}>
                {option.englishName} — SGD → {option.currency}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">
              Buy — {selected.currency} per 1 SGD
            </span>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              placeholder="3250"
              className={field}
            />
            <span className="mt-1 block text-xs text-ink-subtle">
              What the reader receives when they send SGD home.
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">
              Sell <span className="font-normal text-ink-subtle">(optional)</span>
            </span>
            <input
              type="number"
              step="any"
              min="0"
              value={rateSell}
              onChange={(event) => setRateSell(event.target.value)}
              placeholder="3350"
              className={field}
            />
            <span className="mt-1 block text-xs text-ink-subtle">
              Only if the board quotes two sides.
            </span>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Where you saw it</span>
          <input
            type="text"
            required
            maxLength={120}
            value={sourceName}
            onChange={(event) => setSourceName(event.target.value)}
            placeholder="e.g. a money changer at Peninsula Plaza"
            className={field}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">
            Link <span className="font-normal text-ink-subtle">(optional, https)</span>
          </span>
          <input
            type="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            placeholder="https://…"
            className={field}
          />
        </label>

        <button
          type="submit"
          disabled={state === "saving"}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-ink-on-brand disabled:opacity-60"
        >
          {state === "saving" ? "Saving…" : "Record rate"}
        </button>
      </form>

      {state === "saved" ? (
        <StatusMessage variant="success">
          {message ?? "Recorded. It is live on the site now."}
        </StatusMessage>
      ) : null}
      {state === "error" ? (
        <StatusMessage variant="error">{message}</StatusMessage>
      ) : null}

      <div>
        <h3 className="font-semibold text-ink">Recently recorded</h3>
        {recent.length === 0 ? (
          <p className="mt-1 text-sm text-ink-muted">Nothing recorded yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {recent.map((row) => (
              <li
                key={`${row.pair}-${row.observed_at}`}
                className="flex items-baseline justify-between gap-3 py-2 text-sm"
              >
                <span className="text-ink">{row.pair.replace("_", " → ")}</span>
                <span className="text-right">
                  <span className="font-semibold tabular-nums text-ink">{row.rate}</span>
                  <span className="block text-xs text-ink-subtle">
                    {row.source_name ?? "—"} ·{" "}
                    {new Date(row.observed_at).toLocaleDateString("en-SG", {
                      dateStyle: "medium",
                    })}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
