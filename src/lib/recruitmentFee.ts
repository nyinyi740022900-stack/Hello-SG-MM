export type RecruitmentFeeInput = {
  totalFee: number;
  monthlyDeduction: number;
  deductionStartDate: string; // ISO date (yyyy-mm-dd)
};

export type RecruitmentFeeResult = {
  monthsToPayOff: number;
  monthsElapsed: number;
  monthsRemaining: number;
  amountPaidSoFar: number;
  remainingBalance: number;
  payoffDate: string; // ISO date
  isPaidOff: boolean;
};

/**
 * Calculate how far into (and how far from finishing) a recruitment-fee
 * salary deduction a worker is. Pure function — no I/O, easy to unit test.
 *
 * Evidence: Myanmar domestic workers commonly have 6-9 months of salary
 * deducted to repay recruitment/agency fees; construction workers can face
 * S$13,000-16,000 in fees (see 07-additional-features-analysis.md, 1.1).
 */
export function calculateRecruitmentFeePayoff(
  input: RecruitmentFeeInput,
  now: Date = new Date(),
): RecruitmentFeeResult {
  const { totalFee, monthlyDeduction, deductionStartDate } = input;

  if (monthlyDeduction <= 0 || totalFee <= 0) {
    return {
      monthsToPayOff: 0,
      monthsElapsed: 0,
      monthsRemaining: 0,
      amountPaidSoFar: 0,
      remainingBalance: Math.max(0, totalFee),
      payoffDate: deductionStartDate,
      isPaidOff: totalFee <= 0,
    };
  }

  const monthsToPayOff = Math.ceil(totalFee / monthlyDeduction);
  const startDate = new Date(deductionStartDate);

  const monthsElapsedRaw =
    (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
  const monthsElapsed = Math.max(0, Math.min(monthsElapsedRaw, monthsToPayOff));

  const amountPaidSoFar = round2(Math.min(totalFee, monthsElapsed * monthlyDeduction));
  const remainingBalance = round2(Math.max(0, totalFee - amountPaidSoFar));
  const monthsRemaining = Math.max(0, monthsToPayOff - monthsElapsed);

  const payoffDate = new Date(startDate);
  payoffDate.setMonth(payoffDate.getMonth() + monthsToPayOff);

  return {
    monthsToPayOff,
    monthsElapsed,
    monthsRemaining,
    amountPaidSoFar,
    remainingBalance,
    payoffDate: payoffDate.toISOString().slice(0, 10),
    isPaidOff: remainingBalance <= 0,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
