/**
 * Live Singapore environment readings from NEA via data.gov.sg.
 *
 * These are public, keyless endpoints, so unlike everything else in the portal
 * this data needs no agent, no review queue and no database — it is fetched at
 * request time and is always current. That also means it can fail: the API can
 * be slow, rate-limit, or change shape. Every reading here degrades to null
 * rather than throwing, because a missing weather strip is a small loss while a
 * crashed home page is a large one.
 *
 * Haze matters more to this audience than to most: outdoor construction and
 * shipyard workers cannot simply stay inside when the PSI climbs.
 */

const BASE = "https://api.data.gov.sg/v1/environment";

/** Readings change on the order of an hour; cache accordingly. */
const REVALIDATE_SECONDS = 900;

export type WeatherForecast = {
  forecast: string;
  tempLow: number;
  tempHigh: number;
  humidityLow: number;
  humidityHigh: number;
};

export type PsiReading = {
  /** National 24-hour PSI, the figure NEA advises the public to act on. */
  national: number;
  band: PsiBand;
};

/** NEA's published PSI bands. Thresholds are theirs, not ours. */
export type PsiBand = "good" | "moderate" | "unhealthy" | "very_unhealthy" | "hazardous";

export function psiBand(value: number): PsiBand {
  if (value <= 50) return "good";
  if (value <= 100) return "moderate";
  if (value <= 200) return "unhealthy";
  if (value <= 300) return "very_unhealthy";
  return "hazardous";
}

/** WHO / NEA UV exposure categories. */
export type UvBand = "low" | "moderate" | "high" | "very_high" | "extreme";

export function uvBand(value: number): UvBand {
  if (value <= 2) return "low";
  if (value <= 5) return "moderate";
  if (value <= 7) return "high";
  if (value <= 10) return "very_high";
  return "extreme";
}

export type SgConditions = {
  weather: WeatherForecast | null;
  psi: PsiReading | null;
  uvIndex: number | null;
  /** True when at least one reading came back, so callers can hide the strip. */
  hasAny: boolean;
};

async function fetchJson(path: string): Promise<unknown | null> {
  try {
    const response = await fetch(`${BASE}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    return (await response.json()) as unknown;
  } catch {
    // Network failure, timeout, malformed JSON — all handled the same way:
    // this reading is simply unavailable this render.
    return null;
  }
}

function readWeather(payload: unknown): WeatherForecast | null {
  const general = (
    payload as { items?: Array<{ general?: Record<string, unknown> }> } | null
  )?.items?.[0]?.general;
  if (!general) return null;

  const temperature = general.temperature as { low?: number; high?: number } | undefined;
  const humidity = general.relative_humidity as { low?: number; high?: number } | undefined;
  const forecast = general.forecast;

  if (
    typeof forecast !== "string" ||
    typeof temperature?.low !== "number" ||
    typeof temperature?.high !== "number"
  ) {
    return null;
  }

  return {
    forecast,
    tempLow: temperature.low,
    tempHigh: temperature.high,
    humidityLow: typeof humidity?.low === "number" ? humidity.low : 0,
    humidityHigh: typeof humidity?.high === "number" ? humidity.high : 0,
  };
}

function readPsi(payload: unknown): PsiReading | null {
  const readings = (
    payload as
      | { items?: Array<{ readings?: { psi_twenty_four_hourly?: Record<string, number> } }> }
      | null
  )?.items?.[0]?.readings?.psi_twenty_four_hourly;
  if (!readings) return null;

  // Report the worst region rather than an average: someone working in the west
  // is not helped by a number softened by clean air in the east.
  const values = Object.values(readings).filter((v) => typeof v === "number");
  if (values.length === 0) return null;

  const national = Math.round(Math.max(...values));
  return { national, band: psiBand(national) };
}

function readUv(payload: unknown): number | null {
  const records = (
    payload as { items?: Array<{ index?: Array<{ value?: number }> }> } | null
  )?.items?.[0]?.index;
  if (!Array.isArray(records) || records.length === 0) return null;

  const value = records[0]?.value;
  return typeof value === "number" ? value : null;
}

/** Fetch all three readings in parallel. Never throws. */
export async function getSgConditions(): Promise<SgConditions> {
  const [weatherPayload, psiPayload, uvPayload] = await Promise.all([
    fetchJson("/24-hour-weather-forecast"),
    fetchJson("/psi"),
    fetchJson("/uv-index"),
  ]);

  const weather = readWeather(weatherPayload);
  const psi = readPsi(psiPayload);
  const uvIndex = readUv(uvPayload);

  return {
    weather,
    psi,
    uvIndex,
    hasAny: Boolean(weather || psi || uvIndex !== null),
  };
}
