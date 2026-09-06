"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { calculateRecruitmentFeePayoff, type RecruitmentFeeInput } from "@/lib/recruitmentFee";
import FormField, { INPUT_CLASS } from "@/components/ui/FormField";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const STORAGE_KEY = "recruitment_fee_tracker_v1";

const DEFAULT_INPUT: RecruitmentFeeInput = {
  totalFee: 0,
  monthlyDeduction: 0,
  deductionStartDate: new Date().toISOString().slice(0, 10),
};

export default function RecruitmentFeeCalculator() {
  const t = useTranslations("recruitmentFee");
  const [input, setInput] = useState<RecruitmentFeeInput>(DEFAULT_INPUT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let restored: RecruitmentFeeInput | null = null;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        restored = { ...DEFAULT_INPUT, ...(JSON.parse(saved) as Partial<RecruitmentFeeInput>) };
      }
    } catch {
      // ignore malformed storage — fall back to defaults
    }
    queueMicrotask(() => {
      if (restored) setInput(restored);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
    } catch {
      // storage unavailable (private mode, quota) — calculator still works in-memory
    }
  }, [input, hydrated]);

  const result =
    input.totalFee > 0 && input.monthlyDeduction > 0 ? calculateRecruitmentFeePayoff(input) : null;

  return (
    <div className="space-y-5">
      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label={t("fieldTotalFee")} hint={t("fieldTotalFeeHint")}>
            <input
              type="number"
              min="0"
              step="0.01"
              className={INPUT_CLASS}
              value={input.totalFee || ""}
              onChange={(e) => setInput((prev) => ({ ...prev, totalFee: Number(e.target.value) || 0 }))}
            />
          </FormField>
          <FormField label={t("fieldMonthlyDeduction")} hint={t("fieldMonthlyDeductionHint")}>
            <input
              type="number"
              min="0"
              step="0.01"
              className={INPUT_CLASS}
              value={input.monthlyDeduction || ""}
              onChange={(e) =>
                setInput((prev) => ({ ...prev, monthlyDeduction: Number(e.target.value) || 0 }))
              }
            />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label={t("fieldStartDate")}>
              <input
                type="date"
                className={INPUT_CLASS}
                value={input.deductionStartDate}
                onChange={(e) => setInput((prev) => ({ ...prev, deductionStartDate: e.target.value }))}
              />
            </FormField>
          </div>
        </div>
      </Card>

      {result ? (
        <Card className="space-y-4 print:shadow-none">
          <h3 className="font-semibold text-ink">{t("resultTitle")}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-ink-subtle">{t("resultPaidSoFar")}</p>
              <p className="text-lg font-bold text-ink">{input.totalFee > 0 ? result.amountPaidSoFar.toFixed(2) : "0.00"}</p>
            </div>
            <div>
              <p className="text-xs text-ink-subtle">{t("resultRemainingBalance")}</p>
              <p className={`text-lg font-bold ${result.isPaidOff ? "text-success" : "text-danger"}`}>
                {result.remainingBalance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-subtle">{t("resultMonthsRemaining")}</p>
              <p className="text-lg font-bold text-ink">{result.monthsRemaining}</p>
            </div>
            <div>
              <p className="text-xs text-ink-subtle">{t("resultPayoffDate")}</p>
              <p className="text-lg font-bold text-ink">{result.payoffDate}</p>
            </div>
          </div>
          {result.isPaidOff ? (
            <p className="rounded-xl bg-success-soft px-3 py-2 text-sm font-medium text-success">
              {t("resultPaidOffNote")}
            </p>
          ) : null}
          <p className="text-xs text-ink-subtle">{t("disclaimer")}</p>
          <div className="print:hidden">
            <Button variant="secondary" onClick={() => window.print()}>
              {t("printButton")}
            </Button>
          </div>
        </Card>
      ) : (
        <p className="text-sm text-ink-subtle">{t("emptyState")}</p>
      )}
    </div>
  );
}
