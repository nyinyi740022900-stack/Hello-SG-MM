type LogLevel = "info" | "warn" | "error";

type LogMeta = Record<string, string | number | boolean | null | undefined>;

function sanitizeMeta(meta: LogMeta): LogMeta {
  const sanitized: LogMeta = {};
  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined) continue;
    sanitized[key] = value;
  }
  return sanitized;
}

export function logServerEvent(level: LogLevel, event: string, meta: LogMeta = {}) {
  const payload = JSON.stringify({
    event,
    level,
    ts: new Date().toISOString(),
    ...sanitizeMeta(meta),
  });

  if (level === "error") {
    console.error(payload);
    return;
  }
  if (level === "warn") {
    console.warn(payload);
    return;
  }
  console.log(payload);
}
