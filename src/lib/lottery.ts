/**
 * Singapore Pools lottery results — fetched from their public DataFileArchive
 * HTML fragments and single-draw result pages.
 *
 * This app does not place bets. Generators and analysis are for entertainment /
 * reference only; buying happens only via Singapore Pools' official app/site
 * or authorised outlets.
 */

export const LOTTERY_LINKS = {
  home: "https://online.singaporepools.com/en/lottery",
  fourDResults:
    "https://www.singaporepools.com.sg/en/product/sr/Pages/4d_results.aspx",
  totoResults:
    "https://www.singaporepools.com.sg/en/product/sr/Pages/toto_results.aspx",
  fourDRules:
    "https://www.singaporepools.com.sg/en/rules/Pages/pdf/4d-game-rules.pdf",
  account: "https://www.singaporepools.com.sg/ms/spa/en/index.html",
  outlets: "https://www.singaporepools.com.sg/en/faq/Pages/betting-at-outlets.html",
  responsiblePlay: "https://www.ncpg.org.sg/",
  officialApp: "https://www.singaporepools.com.sg/ms/spa/en/index.html",
} as const;

const DATA_BASE =
  "https://www.singaporepools.com.sg/DataFileArchive/Lottery/Output";

const FOUR_D_TOP = `${DATA_BASE}/fourd_result_top_draws_en.html`;
const TOTO_TOP = `${DATA_BASE}/toto_result_top_draws_en.html`;
const FOUR_D_LIST = `${DATA_BASE}/fourd_result_draw_list_en.html`;
const TOTO_LIST = `${DATA_BASE}/toto_result_draw_list_en.html`;
const FOUR_D_PAGE =
  "https://www.singaporepools.com.sg/en/product/Pages/4d_results.aspx";
const TOTO_PAGE =
  "https://www.singaporepools.com.sg/en/product/sr/Pages/toto_results.aspx";

/** Cache draw fragments for 6 hours — enough for period analysis reuse. */
const REVALIDATE_SECONDS = 60 * 60 * 6;

/** Year windows can be large; cap fetches so the API stays within serverless time. */
const YEAR_DRAW_CAP = 48;
const FETCH_CONCURRENCY = 8;

export type AnalysisPeriod = "week" | "month" | "year";
export type GenerateMode = "random" | "hot" | "cold";

export type FourDDraw = {
  drawNo: number;
  drawDateLabel: string;
  /** Epoch ms in SGT for filtering. */
  drawDateMs: number;
  first: string;
  second: string;
  third: string;
  starter: string[];
  consolation: string[];
};

export type TotoDraw = {
  drawNo: number;
  drawDateLabel: string;
  drawDateMs: number;
  winning: number[];
  additional: number | null;
};

export type LotteryBundle = {
  fourD: FourDDraw[];
  toto: TotoDraw[];
  fetchedAt: string;
  source: "singapore-pools";
  error: string | null;
};

export type NumberFrequency = { value: string; count: number };

export type PeriodAnalysis = {
  period: AnalysisPeriod;
  fourD: {
    draws: FourDDraw[];
    hot: NumberFrequency[];
    cold: NumberFrequency[];
    sampleSize: number;
    capped: boolean;
  };
  toto: {
    draws: TotoDraw[];
    hot: NumberFrequency[];
    cold: NumberFrequency[];
    sampleSize: number;
    capped: boolean;
  };
  error: string | null;
};

type DrawListEntry = {
  drawNo: number;
  drawDateLabel: string;
  drawDateMs: number;
  /** Query string already including `sppl=...` */
  queryString: string;
};

const PERIOD_DAYS: Record<AnalysisPeriod, number> = {
  week: 7,
  month: 30,
  year: 365,
};

function pad4(n: number | string): string {
  const digits = String(n).replace(/\D/g, "");
  return digits.padStart(4, "0").slice(-4);
}

function parseDrawDateLabel(label: string): number | null {
  // e.g. Wed, 09 Sep 2026 — treat as Singapore midnight.
  const match = label
    .trim()
    .match(/^[A-Za-z]{3},\s+(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (!match) return null;
  const [, day, mon, year] = match;
  const ms = Date.parse(`${day} ${mon} ${year} 00:00:00 GMT+0800`);
  return Number.isFinite(ms) ? ms : null;
}

function splitBlocks(html: string): string[] {
  return html
    .split(/class=['"]tables-wrap['"]/i)
    .slice(1)
    .map((chunk) => chunk.slice(0, 6000));
}

function firstMatch(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern);
  return match?.[1]?.trim() ?? null;
}

function allMatches(html: string, pattern: RegExp): string[] {
  return [...html.matchAll(pattern)].map((m) => m[1].trim());
}

function parseFourDBlock(block: string): FourDDraw | null {
  const drawNoRaw = firstMatch(block, /Draw No\.\s*(\d+)/i);
  const drawDateLabel = firstMatch(block, /class=['"]drawDate['"]>([^<]+)/i);
  const first = firstMatch(block, /class=['"]tdFirstPrize['"]>([^<]+)/i);
  const second = firstMatch(block, /class=['"]tdSecondPrize['"]>([^<]+)/i);
  const third = firstMatch(block, /class=['"]tdThirdPrize['"]>([^<]+)/i);
  if (!drawNoRaw || !drawDateLabel || !first || !second || !third) return null;

  const drawDateMs = parseDrawDateLabel(drawDateLabel);
  if (drawDateMs == null) return null;

  const starterSection = block.match(/tbodyStarterPrizes[\s\S]*?<\/tbody>/i)?.[0];
  const consolationSection = block.match(
    /tbodyConsolationPrizes[\s\S]*?<\/tbody>/i,
  )?.[0];

  return {
    drawNo: Number(drawNoRaw),
    drawDateLabel,
    drawDateMs,
    first: pad4(first),
    second: pad4(second),
    third: pad4(third),
    starter: starterSection
      ? allMatches(starterSection, /<td[^>]*>([^<]+)<\/td>/gi).map(pad4)
      : [],
    consolation: consolationSection
      ? allMatches(consolationSection, /<td[^>]*>([^<]+)<\/td>/gi).map(pad4)
      : [],
  };
}

function parseTotoBlock(block: string): TotoDraw | null {
  const drawNoRaw = firstMatch(block, /Draw No\.\s*(\d+)/i);
  const drawDateLabel = firstMatch(block, /class=['"]drawDate['"]>([^<]+)/i);
  const winning = [1, 2, 3, 4, 5, 6]
    .map((i) =>
      firstMatch(block, new RegExp(`class=['"]win${i}['"]>(\\d+)`, "i")),
    )
    .filter((v): v is string => Boolean(v))
    .map(Number);
  const additionalRaw = firstMatch(block, /class=['"]additional['"]>(\d+)/i);
  if (!drawNoRaw || !drawDateLabel || winning.length !== 6) return null;

  const drawDateMs = parseDrawDateLabel(drawDateLabel);
  if (drawDateMs == null) return null;

  return {
    drawNo: Number(drawNoRaw),
    drawDateLabel,
    drawDateMs,
    winning,
    additional: additionalRaw ? Number(additionalRaw) : null,
  };
}

export function parseFourDTopDraws(html: string): FourDDraw[] {
  return splitBlocks(html)
    .map(parseFourDBlock)
    .filter((d): d is FourDDraw => Boolean(d));
}

export function parseTotoTopDraws(html: string): TotoDraw[] {
  return splitBlocks(html)
    .map(parseTotoBlock)
    .filter((d): d is TotoDraw => Boolean(d));
}

export function parseFourDDrawList(html: string): DrawListEntry[] {
  const entries: DrawListEntry[] = [];
  for (const match of html.matchAll(
    /value='(\d+)'\s+queryString='([^']+)'[^>]*>([^<]+)/gi,
  )) {
    const drawDateMs = parseDrawDateLabel(match[3]);
    if (drawDateMs == null) continue;
    entries.push({
      drawNo: Number(match[1]),
      queryString: match[2],
      drawDateLabel: match[3].trim(),
      drawDateMs,
    });
  }
  return entries;
}

export function parseTotoDrawList(html: string): DrawListEntry[] {
  const entries: DrawListEntry[] = [];
  for (const match of html.matchAll(
    /queryString='([^']+)'\s+value='(\d+)'[^>]*>([^<]+)/gi,
  )) {
    const drawDateMs = parseDrawDateLabel(match[3]);
    if (drawDateMs == null) continue;
    entries.push({
      drawNo: Number(match[2]),
      queryString: match[1],
      drawDateLabel: match[3].trim(),
      drawDateMs,
    });
  }
  return entries;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: {
        accept: "text/html,*/*",
        "user-agent":
          "Mozilla/5.0 (compatible; HelloSGLottery/1.0; +https://sg-migrant-worker-app.vercel.app)",
      },
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index]);
    }
  }

  const runners = Array.from(
    { length: Math.min(concurrency, Math.max(items.length, 1)) },
    () => run(),
  );
  await Promise.all(runners);
  return results;
}

function entriesForPeriod(
  entries: DrawListEntry[],
  period: AnalysisPeriod,
  nowMs = Date.now(),
): { selected: DrawListEntry[]; capped: boolean } {
  const cutoff = nowMs - PERIOD_DAYS[period] * 24 * 60 * 60 * 1000;
  const inWindow = entries
    .filter((e) => e.drawDateMs >= cutoff)
    .sort((a, b) => b.drawDateMs - a.drawDateMs);

  if (period === "year" && inWindow.length > YEAR_DRAW_CAP) {
    return { selected: inWindow.slice(0, YEAR_DRAW_CAP), capped: true };
  }
  return { selected: inWindow, capped: false };
}

async function fetchFourDDraws(
  entries: DrawListEntry[],
): Promise<FourDDraw[]> {
  const pages = await mapPool(entries, FETCH_CONCURRENCY, async (entry) => {
    const html = await fetchHtml(`${FOUR_D_PAGE}?${entry.queryString}`);
    if (!html) return null;
    const block = splitBlocks(html)[0] ?? html;
    return parseFourDBlock(block);
  });
  return pages.filter((d): d is FourDDraw => Boolean(d));
}

async function fetchTotoDraws(entries: DrawListEntry[]): Promise<TotoDraw[]> {
  const pages = await mapPool(entries, FETCH_CONCURRENCY, async (entry) => {
    const html = await fetchHtml(`${TOTO_PAGE}?${entry.queryString}`);
    if (!html) return null;
    const block = splitBlocks(html)[0] ?? html;
    return parseTotoBlock(block);
  });
  return pages.filter((d): d is TotoDraw => Boolean(d));
}

export async function getLotteryResults(): Promise<LotteryBundle> {
  const [fourDHtml, totoHtml] = await Promise.all([
    fetchHtml(FOUR_D_TOP),
    fetchHtml(TOTO_TOP),
  ]);

  const fourD = fourDHtml ? parseFourDTopDraws(fourDHtml) : [];
  const toto = totoHtml ? parseTotoTopDraws(totoHtml) : [];
  const errors: string[] = [];
  if (!fourDHtml || fourD.length === 0) errors.push("4D");
  if (!totoHtml || toto.length === 0) errors.push("TOTO");

  return {
    fourD,
    toto,
    fetchedAt: new Date().toISOString(),
    source: "singapore-pools",
    error:
      errors.length === 0
        ? null
        : `Could not load latest ${errors.join(" / ")} results.`,
  };
}

function fourDPrizeNumbers(draw: FourDDraw): string[] {
  return [
    draw.first,
    draw.second,
    draw.third,
    ...draw.starter,
    ...draw.consolation,
  ];
}

export function analyzeFourD(draws: FourDDraw[], topN = 10): {
  hot: NumberFrequency[];
  cold: NumberFrequency[];
  sampleSize: number;
} {
  const counts = new Map<string, number>();
  for (const draw of draws) {
    for (const n of fourDPrizeNumbers(draw)) {
      counts.set(n, (counts.get(n) ?? 0) + 1);
    }
  }
  const ranked = [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

  return {
    hot: ranked.slice(0, topN),
    cold: [...ranked].reverse().slice(0, topN),
    sampleSize: draws.length,
  };
}

export function analyzeToto(draws: TotoDraw[], topN = 10): {
  hot: NumberFrequency[];
  cold: NumberFrequency[];
  sampleSize: number;
} {
  const counts = new Map<number, number>();
  for (let n = 1; n <= 49; n += 1) counts.set(n, 0);
  for (const draw of draws) {
    for (const n of draw.winning) {
      counts.set(n, (counts.get(n) ?? 0) + 1);
    }
    if (draw.additional) {
      counts.set(draw.additional, (counts.get(draw.additional) ?? 0) + 1);
    }
  }
  const ranked = [...counts.entries()]
    .map(([value, count]) => ({ value: String(value), count }))
    .sort((a, b) => b.count - a.count || Number(a.value) - Number(b.value));

  return {
    hot: ranked.filter((r) => r.count > 0).slice(0, topN),
    cold: [...ranked].reverse().slice(0, topN),
    sampleSize: draws.length,
  };
}

export async function getPeriodAnalysis(
  period: AnalysisPeriod,
): Promise<PeriodAnalysis> {
  const [fourListHtml, totoListHtml] = await Promise.all([
    fetchHtml(FOUR_D_LIST),
    fetchHtml(TOTO_LIST),
  ]);

  if (!fourListHtml && !totoListHtml) {
    return {
      period,
      fourD: { draws: [], hot: [], cold: [], sampleSize: 0, capped: false },
      toto: { draws: [], hot: [], cold: [], sampleSize: 0, capped: false },
      error: "Could not load Singapore Pools draw lists.",
    };
  }

  const fourEntries = fourListHtml ? parseFourDDrawList(fourListHtml) : [];
  const totoEntries = totoListHtml ? parseTotoDrawList(totoListHtml) : [];
  const fourSel = entriesForPeriod(fourEntries, period);
  const totoSel = entriesForPeriod(totoEntries, period);

  const [fourD, toto] = await Promise.all([
    fetchFourDDraws(fourSel.selected),
    fetchTotoDraws(totoSel.selected),
  ]);

  const fourStats = analyzeFourD(fourD);
  const totoStats = analyzeToto(toto);
  const errors: string[] = [];
  if (fourD.length === 0) errors.push("4D");
  if (toto.length === 0) errors.push("TOTO");

  return {
    period,
    fourD: {
      draws: fourD,
      hot: fourStats.hot,
      cold: fourStats.cold,
      sampleSize: fourStats.sampleSize,
      capped: fourSel.capped,
    },
    toto: {
      draws: toto,
      hot: totoStats.hot,
      cold: totoStats.cold,
      sampleSize: totoStats.sampleSize,
      capped: totoSel.capped,
    },
    error:
      errors.length === 0
        ? null
        : `Could not load ${errors.join(" / ")} draws for this period.`,
  };
}

function pickWeighted(weights: number[]): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return Math.floor(Math.random() * weights.length);
  let roll = Math.random() * total;
  for (let i = 0; i < weights.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return i;
  }
  return weights.length - 1;
}

/** Digit weights from prize numbers in the period (for hot/cold 4D picks). */
function fourDDigitWeights(
  draws: FourDDraw[],
  mode: "hot" | "cold",
): number[][] {
  const counts = Array.from({ length: 4 }, () => Array.from({ length: 10 }, () => 0));
  for (const draw of draws) {
    for (const n of fourDPrizeNumbers(draw)) {
      const digits = pad4(n);
      for (let i = 0; i < 4; i += 1) {
        const d = Number(digits[i]);
        if (d >= 0 && d <= 9) counts[i][d] += 1;
      }
    }
  }

  return counts.map((col) => {
    const max = Math.max(...col, 1);
    return col.map((c) => {
      if (mode === "hot") return c + 1;
      return max - c + 1;
    });
  });
}

export function generateFourD(count = 1): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(pad4(Math.floor(Math.random() * 10000)));
  }
  return out;
}

export function generateFourDFromAnalysis(
  draws: FourDDraw[],
  mode: GenerateMode,
  count = 1,
): string[] {
  if (mode === "random" || draws.length === 0) return generateFourD(count);

  const digitWeights = fourDDigitWeights(draws, mode);
  const out: string[] = [];
  for (let n = 0; n < count; n += 1) {
    const digits = digitWeights.map((weights) => String(pickWeighted(weights)));
    out.push(digits.join(""));
  }
  return out;
}

/** Six unique numbers from 1–49, sorted ascending (Ordinary TOTO style). */
export function generateToto(): number[] {
  const pool = Array.from({ length: 49 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 6).sort((a, b) => a - b);
}

export function generateTotoFromAnalysis(
  draws: TotoDraw[],
  mode: GenerateMode,
): number[] {
  if (mode === "random" || draws.length === 0) return generateToto();

  const counts = new Map<number, number>();
  for (let n = 1; n <= 49; n += 1) counts.set(n, 0);
  for (const draw of draws) {
    for (const n of draw.winning) counts.set(n, (counts.get(n) ?? 0) + 1);
    if (draw.additional) {
      counts.set(draw.additional, (counts.get(draw.additional) ?? 0) + 1);
    }
  }

  const max = Math.max(...counts.values(), 1);
  const available = Array.from({ length: 49 }, (_, i) => i + 1);
  const picked: number[] = [];

  while (picked.length < 6 && available.length > 0) {
    const weights = available.map((n) => {
      const c = counts.get(n) ?? 0;
      return mode === "hot" ? c + 1 : max - c + 1;
    });
    const index = pickWeighted(weights);
    picked.push(available[index]);
    available.splice(index, 1);
  }

  return picked.sort((a, b) => a - b);
}

export function isAnalysisPeriod(value: string): value is AnalysisPeriod {
  return value === "week" || value === "month" || value === "year";
}

export type FourDPrizeTier =
  | "first"
  | "second"
  | "third"
  | "starter"
  | "consolation";

export type FourDBetSize = "big" | "small";
export type FourDEntryType = "ordinary" | "ibet";
export type FourDDigitPattern =
  | "fourDifferent"
  | "onePair"
  | "twoPairs"
  | "threeSame"
  | "fourSame";

/** Official Ordinary / System / Roll prize per $1 (4D Game Rules, 30 Dec 2024). */
const ORDINARY_PRIZE: Record<
  FourDBetSize,
  Partial<Record<FourDPrizeTier, number>>
> = {
  big: {
    first: 2000,
    second: 1000,
    third: 490,
    starter: 250,
    consolation: 60,
  },
  small: {
    first: 3000,
    second: 2000,
    third: 800,
  },
};

/** Official iBet prize per $1 by digit pattern (4D Game Rules, 30 Dec 2024). */
const IBET_PRIZE: Record<
  FourDBetSize,
  Record<
    Exclude<FourDDigitPattern, "fourSame">,
    Partial<Record<FourDPrizeTier, number>>
  >
> = {
  big: {
    fourDifferent: {
      first: 83,
      second: 41,
      third: 20,
      starter: 10,
      consolation: 3,
    },
    onePair: {
      first: 166,
      second: 83,
      third: 40,
      starter: 20,
      consolation: 6,
    },
    twoPairs: {
      first: 335,
      second: 168,
      third: 85,
      starter: 41,
      consolation: 10,
    },
    threeSame: {
      first: 500,
      second: 250,
      third: 127,
      starter: 62,
      consolation: 15,
    },
  },
  small: {
    fourDifferent: { first: 125, second: 83, third: 33 },
    onePair: { first: 250, second: 167, third: 66 },
    twoPairs: { first: 500, second: 333, third: 133 },
    threeSame: { first: 750, second: 500, third: 200 },
  },
};

export function normalizeFourD(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 4) return null;
  return pad4(digits);
}

/** Sorted digit signature — used for iBet (order-independent) matching. */
export function fourDDigitSignature(number: string): string {
  return [...number].sort().join("");
}

export function classifyFourDDigits(number: string): FourDDigitPattern {
  const counts = new Map<string, number>();
  for (const d of number) {
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  const freqs = [...counts.values()].sort((a, b) => b - a);
  if (freqs[0] === 4) return "fourSame";
  if (freqs[0] === 3) return "threeSame";
  if (freqs[0] === 2 && freqs[1] === 2) return "twoPairs";
  if (freqs[0] === 2) return "onePair";
  return "fourDifferent";
}

function collectPrizeNumbers(
  draw: FourDDraw,
): Array<{ prize: FourDPrizeTier; winningNumber: string }> {
  const rows: Array<{ prize: FourDPrizeTier; winningNumber: string }> = [
    { prize: "first", winningNumber: draw.first },
    { prize: "second", winningNumber: draw.second },
    { prize: "third", winningNumber: draw.third },
  ];
  for (const n of draw.starter) {
    rows.push({ prize: "starter", winningNumber: n });
  }
  for (const n of draw.consolation) {
    rows.push({ prize: "consolation", winningNumber: n });
  }
  return rows;
}

export type FourDPrizeLine = {
  prize: FourDPrizeTier;
  winningNumber: string;
  amountPerDollar: number;
  payout: number;
};

export type FourDPrizeEstimate = {
  number: string;
  entry: FourDEntryType;
  size: FourDBetSize;
  stake: number;
  pattern: FourDDigitPattern;
  ibetAllowed: boolean;
  draw: FourDDraw;
  lines: FourDPrizeLine[];
  total: number;
};

/**
 * Estimate Ordinary or iBet winnings for one draw + stake.
 * Tables from Singapore Pools 4D Game Rules (30 Dec 2024).
 */
export function estimateFourDPrize(input: {
  rawNumber: string;
  draw: FourDDraw | null | undefined;
  entry: FourDEntryType;
  size: FourDBetSize;
  stake: number;
}): FourDPrizeEstimate | null {
  const number = normalizeFourD(input.rawNumber);
  if (!number || !input.draw) return null;
  if (!Number.isFinite(input.stake) || input.stake < 1) return null;

  const pattern = classifyFourDDigits(number);
  const ibetAllowed = pattern !== "fourSame";
  if (input.entry === "ibet" && !ibetAllowed) {
    return {
      number,
      entry: input.entry,
      size: input.size,
      stake: input.stake,
      pattern,
      ibetAllowed: false,
      draw: input.draw,
      lines: [],
      total: 0,
    };
  }

  const table: Partial<Record<FourDPrizeTier, number>> =
    input.entry === "ordinary"
      ? ORDINARY_PRIZE[input.size]
      : IBET_PRIZE[input.size][
          pattern as Exclude<FourDDigitPattern, "fourSame">
        ];

  const lines: FourDPrizeLine[] = [];
  for (const row of collectPrizeNumbers(input.draw)) {
    const matched =
      input.entry === "ordinary"
        ? row.winningNumber === number
        : fourDDigitSignature(row.winningNumber) === fourDDigitSignature(number);
    if (!matched) continue;
    const amountPerDollar = table[row.prize];
    if (amountPerDollar == null) continue; // e.g. Small + Starter
    lines.push({
      prize: row.prize,
      winningNumber: row.winningNumber,
      amountPerDollar,
      payout: amountPerDollar * input.stake,
    });
  }

  const total = lines.reduce((sum, line) => sum + line.payout, 0);
  return {
    number,
    entry: input.entry,
    size: input.size,
    stake: input.stake,
    pattern,
    ibetAllowed,
    draw: input.draw,
    lines,
    total,
  };
}

export type TotoCheckResult = {
  picks: number[];
  draw: TotoDraw;
  winningMatched: number[];
  additionalMatched: boolean;
  matchCount: number;
  /** Ordinary TOTO group 1–7, or null if no prize. */
  group: 1 | 2 | 3 | 4 | 5 | 6 | 7 | null;
  /** Fixed Ordinary prize for Groups 5–7 only; pool groups are null. */
  fixedPrizePerOrdinary: number | null;
};

export type TotoEntryType =
  | "ordinary"
  | "system7"
  | "system8"
  | "system9"
  | "system10"
  | "system11"
  | "system12"
  | "systemRoll";

export type TotoPrizeGroup = NonNullable<TotoCheckResult["group"]>;

export type TotoSystemCheckResult = {
  entry: TotoEntryType;
  picks: number[];
  draw: TotoDraw;
  boardCount: number;
  /** Best (lowest group number) among winning boards; null = no prize. */
  bestGroup: TotoPrizeGroup | null;
  /** How many ordinary boards hit each group. */
  groupCounts: Partial<Record<TotoPrizeGroup, number>>;
  winningBoardCount: number;
  /** Sum of fixed Ordinary SGD for Groups 5–7 boards only. */
  fixedPrizeTotal: number;
};

function totoOrdinaryGroup(
  matchCount: number,
  additionalMatched: boolean,
): TotoCheckResult["group"] {
  if (matchCount === 6) return 1;
  if (matchCount === 5 && additionalMatched) return 2;
  if (matchCount === 5) return 3;
  if (matchCount === 4 && additionalMatched) return 4;
  if (matchCount === 4) return 5;
  if (matchCount === 3 && additionalMatched) return 6;
  if (matchCount === 3) return 7;
  return null;
}

/** Fixed Ordinary amounts from TOTO Game Rules (Groups 5–7). */
function totoFixedPrize(
  group: TotoCheckResult["group"],
): number | null {
  if (group === 5) return 50;
  if (group === 6) return 25;
  if (group === 7) return 10;
  return null;
}

/** How many numbers the player must pick for this entry type. */
export function totoEntryPickCount(entry: TotoEntryType): number {
  if (entry === "ordinary") return 6;
  if (entry === "systemRoll") return 5;
  if (entry === "system7") return 7;
  if (entry === "system8") return 8;
  if (entry === "system9") return 9;
  if (entry === "system10") return 10;
  if (entry === "system11") return 11;
  return 12;
}

/** Ordinary boards covered by this entry (Singapore Pools unit count). */
export function totoEntryBoardCount(entry: TotoEntryType): number {
  if (entry === "ordinary") return 1;
  if (entry === "systemRoll") return 44; // 5 fixed + each of remaining 44
  const n = totoEntryPickCount(entry);
  return combinationsCount(n, 6);
}

function combinationsCount(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let num = 1;
  let den = 1;
  for (let i = 1; i <= k; i += 1) {
    num *= n - k + i;
    den *= i;
  }
  return Math.round(num / den);
}

/** All k-combinations from sorted unique numbers. */
export function combinationsOf<T>(items: T[], k: number): T[][] {
  if (k <= 0 || k > items.length) return [];
  const out: T[][] = [];
  const walk = (start: number, path: T[]) => {
    if (path.length === k) {
      out.push([...path]);
      return;
    }
    for (let i = start; i < items.length; i += 1) {
      path.push(items[i]);
      walk(i + 1, path);
      path.pop();
    }
  };
  walk(0, []);
  return out;
}

function ordinaryBoardsForEntry(
  entry: TotoEntryType,
  picks: number[],
): number[][] {
  const unique = [...new Set(picks.filter((n) => n >= 1 && n <= 49))].sort(
    (a, b) => a - b,
  );
  const need = totoEntryPickCount(entry);
  if (unique.length !== need) return [];

  if (entry === "ordinary") return [unique];

  if (entry === "systemRoll") {
    const pool = Array.from({ length: 49 }, (_, i) => i + 1);
    const fixed = new Set(unique);
    return pool
      .filter((n) => !fixed.has(n))
      .map((extra) => [...unique, extra].sort((a, b) => a - b));
  }

  return combinationsOf(unique, 6);
}

/** Check Ordinary TOTO picks against one draw. */
export function checkTotoNumbers(
  picks: number[],
  draw: TotoDraw | null | undefined,
): TotoCheckResult | null {
  if (!draw) return null;
  const unique = [...new Set(picks.filter((n) => n >= 1 && n <= 49))];
  if (unique.length !== 6) return null;

  const winningSet = new Set(draw.winning);
  const winningMatched = unique
    .filter((n) => winningSet.has(n))
    .sort((a, b) => a - b);
  const additionalMatched =
    draw.additional != null && unique.includes(draw.additional);
  const matchCount = winningMatched.length;
  const group = totoOrdinaryGroup(matchCount, additionalMatched);

  return {
    picks: unique.sort((a, b) => a - b),
    draw,
    winningMatched,
    additionalMatched,
    matchCount,
    group,
    fixedPrizePerOrdinary: totoFixedPrize(group),
  };
}

/**
 * Check Ordinary / System / System Roll against one draw.
 * System entries expand into ordinary boards and summarise prize groups.
 */
export function checkTotoEntry(
  entry: TotoEntryType,
  picks: number[],
  draw: TotoDraw | null | undefined,
): TotoSystemCheckResult | null {
  if (!draw) return null;
  const boards = ordinaryBoardsForEntry(entry, picks);
  if (boards.length === 0) return null;

  const groupCounts: Partial<Record<TotoPrizeGroup, number>> = {};
  let bestGroup: TotoPrizeGroup | null = null;
  let winningBoardCount = 0;
  let fixedPrizeTotal = 0;

  for (const board of boards) {
    const result = checkTotoNumbers(board, draw);
    if (!result?.group) continue;
    winningBoardCount += 1;
    groupCounts[result.group] = (groupCounts[result.group] ?? 0) + 1;
    if (bestGroup == null || result.group < bestGroup) {
      bestGroup = result.group;
    }
    if (result.fixedPrizePerOrdinary != null) {
      fixedPrizeTotal += result.fixedPrizePerOrdinary;
    }
  }

  const unique = [...new Set(picks.filter((n) => n >= 1 && n <= 49))].sort(
    (a, b) => a - b,
  );

  return {
    entry,
    picks: unique,
    draw,
    boardCount: boards.length,
    bestGroup,
    groupCounts,
    winningBoardCount,
    fixedPrizeTotal,
  };
}

export const TOTO_ENTRY_TYPES: TotoEntryType[] = [
  "ordinary",
  "system7",
  "system8",
  "system9",
  "system10",
  "system11",
  "system12",
  "systemRoll",
];
