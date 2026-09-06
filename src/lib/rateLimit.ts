type Entry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Entry>();

export function consumeRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): { allowed: boolean; remaining: number; resetAt: number } {
  const now = params.now ?? Date.now();
  const existing = buckets.get(params.key);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + params.windowMs;
    buckets.set(params.key, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(0, params.limit - 1), resetAt };
  }

  if (existing.count >= params.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  buckets.set(params.key, existing);
  return {
    allowed: true,
    remaining: Math.max(0, params.limit - existing.count),
    resetAt: existing.resetAt,
  };
}
