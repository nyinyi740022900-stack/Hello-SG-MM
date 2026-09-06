import { describe, expect, it } from "vitest";
import { calculateRecruitmentFeePayoff } from "@/lib/recruitmentFee";

describe("calculateRecruitmentFeePayoff", () => {
  it("computes months remaining partway through the deduction period", () => {
    const result = calculateRecruitmentFeePayoff(
      { totalFee: 2700, monthlyDeduction: 450, deductionStartDate: "2026-06-05" },
      new Date("2026-09-05T00:00:00.000Z"),
    );

    expect(result.monthsToPayOff).toBe(6);
    expect(result.monthsElapsed).toBe(3);
    expect(result.monthsRemaining).toBe(3);
    expect(result.amountPaidSoFar).toBe(1350);
    expect(result.remainingBalance).toBe(1350);
    expect(result.isPaidOff).toBe(false);
  });

  it("caps elapsed months at the payoff point and reports paid off", () => {
    const result = calculateRecruitmentFeePayoff(
      { totalFee: 900, monthlyDeduction: 450, deductionStartDate: "2026-01-01" },
      new Date("2026-09-05T00:00:00.000Z"),
    );

    expect(result.monthsToPayOff).toBe(2);
    expect(result.monthsElapsed).toBe(2);
    expect(result.remainingBalance).toBe(0);
    expect(result.isPaidOff).toBe(true);
  });

  it("handles zero/invalid input without dividing by zero", () => {
    const result = calculateRecruitmentFeePayoff({
      totalFee: 1000,
      monthlyDeduction: 0,
      deductionStartDate: "2026-01-01",
    });

    expect(result.monthsToPayOff).toBe(0);
    expect(result.remainingBalance).toBe(1000);
    expect(result.isPaidOff).toBe(false);
  });
});
