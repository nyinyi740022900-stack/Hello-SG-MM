"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  addSalaryEntry,
  deleteSalaryEntry,
  listSalaryEntries,
  summarizeSalaryEntries,
  type SalaryEntry,
} from "@/lib/salaryLog";
import FormField, { INPUT_CLASS } from "@/components/ui/FormField";
import StatusMessage from "@/components/ui/StatusMessage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const entrySchema = z.object({
  entryDate: z.string().min(4),
  expectedAmount: z.number().nonnegative(),
  receivedAmount: z.number().nonnegative(),
  currency: z.enum(["SGD", "USD", "MMK"]),
  note: z.string().max(200).optional(),
});

type EntryFormValues = z.infer<typeof entrySchema>;

type ExportState =
  | { phase: "idle" }
  | { phase: "exporting" }
  | { phase: "success" }
  | { phase: "error"; message: string };

export default function SalaryLogPanel() {
  const t = useTranslations("salaryLog");
  const { user } = useAuth();

  const [entries, setEntries] = useState<SalaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [exportState, setExportState] = useState<ExportState>({ phase: "idle" });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      entryDate: new Date().toISOString().slice(0, 10),
      expectedAmount: 0,
      receivedAmount: 0,
      currency: "SGD",
      note: "",
    },
  });

  const refresh = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await listSalaryEntries(user.id);
    if (error) {
      setLoadError(error);
    } else {
      setEntries(data ?? []);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  const onSubmit = async (values: EntryFormValues) => {
    if (!user) return;
    setSubmitError(null);
    const { error } = await addSalaryEntry(user.id, {
      entryDate: values.entryDate,
      expectedAmount: values.expectedAmount,
      receivedAmount: values.receivedAmount,
      currency: values.currency,
      note: values.note,
    });
    if (error) {
      setSubmitError(error);
      return;
    }
    reset({ ...values, note: "" });
    void refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteSalaryEntry(id);
    void refresh();
  };

  const summary = summarizeSalaryEntries(entries);

  const handleExport = async () => {
    if (!user || !supabase) return;
    if (!fullName.trim()) {
      setExportState({ phase: "error", message: t("errorNameRequired") });
      return;
    }
    setExportState({ phase: "exporting" });

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      setExportState({ phase: "error", message: t("errorSessionExpired") });
      return;
    }

    const response = await fetch("/api/export/salary-report", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ fullName: fullName.trim(), entries }),
    });

    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => ({}));
      const message =
        typeof payload === "object" && payload !== null && "error" in payload
          ? String((payload as { error: unknown }).error)
          : t("errorExportFailed");
      setExportState({ phase: "error", message });
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const contentDisposition = response.headers.get("Content-Disposition");
    const filenameMatch = contentDisposition?.match(/filename="(.+?)"/);
    link.download = filenameMatch?.[1] ?? "salary_record.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportState({ phase: "success" });
  };

  return (
    <div className="space-y-5">
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
          <FormField label={t("fieldDate")} error={errors.entryDate?.message}>
            <input type="date" className={INPUT_CLASS} {...register("entryDate")} />
          </FormField>
          <FormField label={t("fieldCurrency")}>
            <select className={INPUT_CLASS} {...register("currency")}>
              <option value="SGD">SGD</option>
              <option value="USD">USD</option>
              <option value="MMK">MMK</option>
            </select>
          </FormField>
          <FormField label={t("fieldExpected")} error={errors.expectedAmount?.message}>
            <input
              type="number"
              step="0.01"
              min="0"
              className={INPUT_CLASS}
              {...register("expectedAmount", { valueAsNumber: true })}
            />
          </FormField>
          <FormField label={t("fieldReceived")} error={errors.receivedAmount?.message}>
            <input
              type="number"
              step="0.01"
              min="0"
              className={INPUT_CLASS}
              {...register("receivedAmount", { valueAsNumber: true })}
            />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label={t("fieldNote")}>
              <input type="text" className={INPUT_CLASS} placeholder={t("fieldNoteHint")} {...register("note")} />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {t("addEntry")}
            </Button>
          </div>
        </form>
        {submitError ? (
          <div className="mt-3">
            <StatusMessage variant="error">{submitError}</StatusMessage>
          </div>
        ) : null}
      </Card>

      <Card className="grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs text-ink-subtle">{t("summaryExpected")}</p>
          <p className="text-lg font-bold text-ink">{summary.totalExpected.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-subtle">{t("summaryReceived")}</p>
          <p className="text-lg font-bold text-ink">{summary.totalReceived.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-subtle">{t("summaryShortfall")}</p>
          <p className={`text-lg font-bold ${summary.totalShortfall > 0 ? "text-danger" : "text-success"}`}>
            {summary.totalShortfall.toFixed(2)}
          </p>
        </div>
      </Card>

      {isLoading ? (
        <StatusMessage variant="loading">{t("loadingEntries")}</StatusMessage>
      ) : loadError ? (
        <StatusMessage variant="error">{loadError}</StatusMessage>
      ) : entries.length === 0 ? (
        <StatusMessage variant="info">{t("noEntries")}</StatusMessage>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const shortfall = entry.expected_amount - entry.received_amount;
            return (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{entry.entry_date}</p>
                  <p className="text-xs text-ink-subtle">
                    {t("summaryExpected")}: {entry.currency} {entry.expected_amount.toFixed(2)} ·{" "}
                    {t("summaryReceived")}: {entry.currency} {entry.received_amount.toFixed(2)}
                  </p>
                  {entry.note ? <p className="mt-0.5 text-xs text-ink-subtle">{entry.note}</p> : null}
                </div>
                <div className="flex items-center gap-3">
                  {shortfall > 0 ? (
                    <span className="rounded-full bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger">
                      -{entry.currency} {shortfall.toFixed(2)}
                    </span>
                  ) : (
                    <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
                      {t("ok")}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleDelete(entry.id)}
                    className="text-xs text-ink-subtle underline hover:text-danger"
                  >
                    {t("delete")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Card className="space-y-3 border-brand-soft-border bg-brand-soft">
        <h3 className="font-semibold text-brand-strong">{t("exportTitle")}</h3>
        <p className="text-sm text-ink-muted">{t("exportSubtitle")}</p>
        <FormField label={t("fieldFullName")}>
          <input
            type="text"
            className={INPUT_CLASS}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t("fieldFullNamePlaceholder")}
          />
        </FormField>

        <Button onClick={() => void handleExport()} disabled={exportState.phase === "exporting" || entries.length === 0}>
          {exportState.phase === "exporting" ? t("exporting") : t("exportButton")}
        </Button>

        {exportState.phase === "error" ? (
          <StatusMessage variant="error">{exportState.message}</StatusMessage>
        ) : null}
        {exportState.phase === "success" ? (
          <StatusMessage variant="success">{t("exportSuccess")}</StatusMessage>
        ) : null}
      </Card>
    </div>
  );
}
