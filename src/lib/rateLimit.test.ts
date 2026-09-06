import { describe, expect, it } from "vitest";
import { consumeRateLimit } from "@/lib/rateLimit";

describe("consumeRateLimit", () => {
  it("allows requests within limit and blocks after limit", () => {
    const now = Date.now();
    const first = consumeRateLimit({ key: "export:test", limit: 2, windowMs: 1000, now });
    const second = consumeRateLimit({ key: "export:test", limit: 2, windowMs: 1000, now: now + 10 });
    const third = consumeRateLimit({ key: "export:test", limit: 2, windowMs: 1000, now: now + 20 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });

  it("resets after window expires", () => {
    const now = Date.now();
    consumeRateLimit({ key: "reset:test", limit: 1, windowMs: 1000, now });
    const nextWindow = consumeRateLimit({
      key: "reset:test",
      limit: 1,
      windowMs: 1000,
      now: now + 1500,
    });
    expect(nextWindow.allowed).toBe(true);
  });
});
