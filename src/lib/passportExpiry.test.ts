import { describe, expect, it } from "vitest";
import { calculatePassportExpiry } from "@/lib/passportExpiry";

describe("calculatePassportExpiry", () => {
  it("returns null for empty or invalid dates", () => {
    expect(calculatePassportExpiry("")).toBeNull();
    expect(calculatePassportExpiry("not-a-date")).toBeNull();
  });

  it("flags a freshly issued passport as ok", () => {
    const result = calculatePassportExpiry("2026-01-01", new Date("2026-06-01"));
    expect(result?.status).toBe("ok");
    expect(result?.expiryDate).toBe("2031-01-01");
  });

  it("flags warning inside the 180-day window", () => {
    const result = calculatePassportExpiry("2021-01-01", new Date("2025-09-01"));
    expect(result?.status).toBe("warning");
  });

  it("flags urgent inside the 90-day window", () => {
    const result = calculatePassportExpiry("2021-01-01", new Date("2025-11-15"));
    expect(result?.status).toBe("urgent");
  });

  it("flags expired passports", () => {
    const result = calculatePassportExpiry("2019-01-01", new Date("2026-06-01"));
    expect(result?.status).toBe("expired");
    expect(result?.daysRemaining).toBeLessThan(0);
  });
});
