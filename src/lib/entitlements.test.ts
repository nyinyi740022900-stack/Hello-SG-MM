import { describe, expect, it } from "vitest";
import { PRODUCT_CODES, summarizeEntitlements } from "@/lib/entitlements";

describe("summarizeEntitlements", () => {
  it("returns zero summary when rows are empty", () => {
    const result = summarizeEntitlements([], PRODUCT_CODES.PASSPORT_RENEWAL_PDF, new Date("2026-09-05T00:00:00.000Z"));
    expect(result.totalExports).toBe(0);
    expect(result.remainingExports).toBe(0);
    expect(result.isValid).toBe(false);
  });

  it("ignores expired rows and keeps active entitlement balance", () => {
    const result = summarizeEntitlements(
      [
        {
          id: "a",
          total_exports: 2,
          used_exports: 1,
          expires_at: "2026-09-04T00:00:00.000Z",
        },
        {
          id: "b",
          total_exports: 3,
          used_exports: 1,
          expires_at: "2026-10-01T00:00:00.000Z",
        },
      ],
      PRODUCT_CODES.PASSPORT_RENEWAL_PDF,
      new Date("2026-09-05T00:00:00.000Z"),
    );

    expect(result.totalExports).toBe(3);
    expect(result.usedExports).toBe(1);
    expect(result.remainingExports).toBe(2);
    expect(result.isValid).toBe(true);
  });
});
