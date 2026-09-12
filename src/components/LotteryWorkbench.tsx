"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  checkTotoEntry,
  checkTotoNumbers,
  classifyFourDDigits,
  estimateFourDPrize,
  generateFourDFromAnalysis,
  generateTotoFromAnalysis,
  LOTTERY_LINKS,
  TOTO_ENTRY_TYPES,
  totoEntryBoardCount,
  totoEntryPickCount,
  type AnalysisPeriod,
  type FourDBetSize,
  type FourDDigitPattern,
  type FourDDraw,
  type FourDEntryType,
  type FourDPrizeEstimate,
  type FourDPrizeTier,
  type GenerateMode,
  type NumberFrequency,
  type PeriodAnalysis,
  type TotoDraw,
  type TotoEntryType,
} from "@/lib/lottery";

const EXTERNAL =
  "font-semibold text-brand-strong underline underline-offset-2";

const PERIODS: AnalysisPeriod[] = ["week", "month", "year"];
const MODES: GenerateMode[] = ["random", "hot", "cold"];
const TOTO_POOL = Array.from({ length: 49 }, (_, i) => i + 1);
const BOARD_COUNT = 5;
const EMPTY_BOARDS = (): string[] =>
  Array.from({ length: BOARD_COUNT }, () => "");

type GameId = "fourD" | "toto";
/** Check is always open at the top — not an accordion. */
type SectionId = "generate" | "results" | "analysis";

type LotteryWorkbenchProps = {
  fourDDraws: FourDDraw[];
  totoDraws: TotoDraw[];
  resultsError: string | null;
};

function formatSgd(amount: number): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function FreqChips({
  items,
  empty,
}: {
  items: NumberFrequency[];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-subtle">{empty}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item.value}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-sm"
        >
          <span className="font-mono font-bold tabular-nums text-ink">
            {item.value}
          </span>
          <span className="text-xs text-ink-subtle">×{item.count}</span>
        </span>
      ))}
    </div>
  );
}

function SegmentedButtons<T extends string>({
  options,
  value,
  onChange,
  labelFor,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  labelFor: (option: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={[
              "rounded-full px-3 py-1.5 text-sm font-semibold transition",
              active
                ? "bg-brand text-white"
                : "border border-border bg-surface text-ink-muted hover:bg-surface-muted",
            ].join(" ")}
          >
            {labelFor(option)}
          </button>
        );
      })}
    </div>
  );
}

function AccordionSection({
  id,
  openId,
  onToggle,
  title,
  children,
}: {
  id: SectionId;
  openId: SectionId | null;
  onToggle: (id: SectionId) => void;
  title: string;
  children: ReactNode;
}) {
  const open = openId === id;
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-surface-muted"
      >
        <span className="font-semibold text-ink">{title}</span>
        <span className="text-lg text-ink-subtle" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-border px-4 py-4">{children}</div>
      ) : null}
    </div>
  );
}

function DrawSelect({
  draws,
  value,
  onChange,
  label,
}: {
  draws: Array<{ drawNo: number; drawDateLabel: string }>;
  value: number | null;
  onChange: (drawNo: number) => void;
  label: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <select
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={draws.length === 0}
      >
        {draws.length === 0 ? (
          <option value="">—</option>
        ) : (
          draws.map((draw) => (
            <option key={draw.drawNo} value={draw.drawNo}>
              {draw.drawDateLabel} · #{draw.drawNo}
            </option>
          ))
        )}
      </select>
    </label>
  );
}

function FourDDrawCard({ draw }: { draw: FourDDraw }) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{draw.drawDateLabel}</p>
        <p className="text-xs text-ink-subtle">#{draw.drawNo}</p>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        {[
          ["1st", draw.first],
          ["2nd", draw.second],
          ["3rd", draw.third],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-surface px-2 py-2">
            <p className="text-[11px] text-ink-subtle">{label}</p>
            <p className="font-mono text-base font-bold tabular-nums text-ink">
              {value}
            </p>
          </div>
        ))}
      </div>
      {draw.starter.length > 0 ? (
        <p className="mt-2 text-xs text-ink-muted">
          Starter:{" "}
          <span className="font-mono tabular-nums">
            {draw.starter.join(" · ")}
          </span>
        </p>
      ) : null}
      {draw.consolation.length > 0 ? (
        <p className="mt-1 text-xs text-ink-muted">
          Consolation:{" "}
          <span className="font-mono tabular-nums">
            {draw.consolation.join(" · ")}
          </span>
        </p>
      ) : null}
    </div>
  );
}

function TotoDrawCard({ draw }: { draw: TotoDraw }) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{draw.drawDateLabel}</p>
        <p className="text-xs text-ink-subtle">#{draw.drawNo}</p>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {draw.winning.map((n) => (
          <span
            key={`${draw.drawNo}-${n}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-sm font-bold tabular-nums text-brand-strong"
          >
            {n}
          </span>
        ))}
        {draw.additional != null ? (
          <span className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-2.5 text-xs font-semibold tabular-nums text-ink-muted">
            +{draw.additional}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function FourDHistory({ draws }: { draws: FourDDraw[] }) {
  return (
    <ul className="space-y-3">
      {draws.map((draw) => (
        <li key={draw.drawNo}>
          <FourDDrawCard draw={draw} />
        </li>
      ))}
    </ul>
  );
}

function TotoHistory({ draws }: { draws: TotoDraw[] }) {
  return (
    <ul className="space-y-3">
      {draws.map((draw) => (
        <li key={draw.drawNo}>
          <TotoDrawCard draw={draw} />
        </li>
      ))}
    </ul>
  );
}

export default function LotteryWorkbench({
  fourDDraws,
  totoDraws,
  resultsError,
}: LotteryWorkbenchProps) {
  const t = useTranslations("lottery");
  const [game, setGame] = useState<GameId>("fourD");
  const [openSection, setOpenSection] = useState<SectionId | null>(null);

  const [period, setPeriod] = useState<AnalysisPeriod>("week");
  const [mode, setMode] = useState<GenerateMode>("random");
  const [analysis, setAnalysis] = useState<PeriodAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [genFourD, setGenFourD] = useState<string[]>([]);
  const [genToto, setGenToto] = useState<number[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const [fourDDrawNo, setFourDDrawNo] = useState<number | null>(
    fourDDraws[0]?.drawNo ?? null,
  );
  const [boards, setBoards] = useState<string[]>(EMPTY_BOARDS);
  const [entryType, setEntryType] = useState<FourDEntryType>("ordinary");
  const [betSize, setBetSize] = useState<FourDBetSize>("big");
  const [stake, setStake] = useState(1);
  const [fourDChecked, setFourDChecked] = useState(false);

  const [totoDrawNo, setTotoDrawNo] = useState<number | null>(
    totoDraws[0]?.drawNo ?? null,
  );
  const [totoEntry, setTotoEntry] = useState<TotoEntryType>("ordinary");
  const [totoPicks, setTotoPicks] = useState<number[]>([]);
  const [totoChecked, setTotoChecked] = useState(false);

  const periodLabel = (p: AnalysisPeriod) => {
    if (p === "week") return t("periodWeek");
    if (p === "month") return t("periodMonth");
    return t("periodYear");
  };

  const modeLabel = (m: GenerateMode) => {
    if (m === "random") return t("modeRandom");
    if (m === "hot") return t("modeHot");
    return t("modeCold");
  };

  const prizeLabel = (prize: FourDPrizeTier) => {
    if (prize === "first") return t("prizeFirst");
    if (prize === "second") return t("prizeSecond");
    if (prize === "third") return t("prizeThird");
    if (prize === "starter") return t("prizeStarter");
    return t("prizeConsolation");
  };

  const patternLabel = (pattern: FourDDigitPattern) => {
    if (pattern === "fourDifferent") return t("patternFourDifferent");
    if (pattern === "onePair") return t("patternOnePair");
    if (pattern === "twoPairs") return t("patternTwoPairs");
    if (pattern === "threeSame") return t("patternThreeSame");
    return t("patternFourSame");
  };

  useEffect(() => {
    if (fourDDraws.length === 0) {
      setFourDDrawNo(null);
      return;
    }
    setFourDDrawNo((prev) =>
      prev != null && fourDDraws.some((d) => d.drawNo === prev)
        ? prev
        : fourDDraws[0].drawNo,
    );
  }, [fourDDraws]);

  useEffect(() => {
    if (totoDraws.length === 0) {
      setTotoDrawNo(null);
      return;
    }
    setTotoDrawNo((prev) =>
      prev != null && totoDraws.some((d) => d.drawNo === prev)
        ? prev
        : totoDraws[0].drawNo,
    );
  }, [totoDraws]);

  useEffect(() => {
    if (openSection !== "generate" && openSection !== "analysis") return;

    let mounted = true;
    const load = async () => {
      setAnalysisLoading(true);
      setAnalysisError(null);
      try {
        const response = await fetch(`/api/lottery/analysis?period=${period}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as PeriodAnalysis & {
          error?: string;
        };
        if (!mounted) return;
        if (!response.ok) {
          setAnalysis(null);
          setAnalysisError(payload.error ?? t("analysisLoadFailed"));
          return;
        }
        setAnalysis(payload);
        setAnalysisError(payload.error);
      } catch {
        if (!mounted) return;
        setAnalysis(null);
        setAnalysisError(t("analysisLoadFailed"));
      } finally {
        if (mounted) setAnalysisLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [period, openSection, t]);

  const analysisFourD = analysis?.fourD.draws ?? [];
  const analysisToto = analysis?.toto.draws ?? [];

  const selectedFourD =
    fourDDraws.find((d) => d.drawNo === fourDDrawNo) ?? null;
  const selectedToto = totoDraws.find((d) => d.drawNo === totoDrawNo) ?? null;

  const fourDEstimates = useMemo(() => {
    if (!fourDChecked || !selectedFourD) return [] as FourDPrizeEstimate[];
    const out: FourDPrizeEstimate[] = [];
    for (const raw of boards) {
      if (raw.replace(/\D/g, "").length !== 4) continue;
      const estimate = estimateFourDPrize({
        rawNumber: raw,
        draw: selectedFourD,
        entry: entryType,
        size: betSize,
        stake,
      });
      if (estimate) out.push(estimate);
    }
    return out;
  }, [fourDChecked, boards, selectedFourD, entryType, betSize, stake]);

  const fourDGrandTotal = fourDEstimates.reduce((sum, row) => sum + row.total, 0);

  const totoPickNeed = totoEntryPickCount(totoEntry);
  const totoBoardsForEntry = totoEntryBoardCount(totoEntry);

  const totoCheck = useMemo(() => {
    if (!totoChecked) return null;
    return checkTotoEntry(totoEntry, totoPicks, selectedToto);
  }, [totoChecked, totoEntry, totoPicks, selectedToto]);

  const totoOrdinaryDetail = useMemo(() => {
    if (!totoChecked || totoEntry !== "ordinary") return null;
    return checkTotoNumbers(totoPicks, selectedToto);
  }, [totoChecked, totoEntry, totoPicks, selectedToto]);

  const modeHint = useMemo(() => {
    if (mode === "random") return t("modeHintRandom");
    if (mode === "hot") return t("modeHintHot");
    return t("modeHintCold");
  }, [mode, t]);

  const copyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  const toggleSection = (id: SectionId) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const switchGame = (next: GameId) => {
    setGame(next);
    setOpenSection(null);
    setFourDChecked(false);
    setTotoChecked(false);
  };

  const updateBoard = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setBoards((prev) => {
      const next = [...prev];
      next[index] = digits;
      return next;
    });
    setFourDChecked(false);
  };

  const filledBoardCount = boards.filter(
    (b) => b.replace(/\D/g, "").length === 4,
  ).length;

  const toggleTotoPick = (n: number) => {
    setTotoChecked(false);
    setTotoPicks((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      if (prev.length >= totoPickNeed) return prev;
      return [...prev, n].sort((a, b) => a - b);
    });
  };

  const setTotoEntryType = (next: TotoEntryType) => {
    setTotoEntry(next);
    setTotoChecked(false);
    const need = totoEntryPickCount(next);
    setTotoPicks((prev) => prev.slice(0, need));
  };

  const totoEntryLabel = (entry: TotoEntryType) => {
    if (entry === "ordinary") return t("totoEntryOrdinary");
    if (entry === "systemRoll") return t("totoEntrySystemRoll");
    return t("totoEntrySystemN", { n: totoEntryPickCount(entry) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-ink-muted">{t("pickGameHint")}</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => switchGame("fourD")}
            className={[
              "rounded-2xl border px-4 py-3 text-center text-sm font-bold transition",
              game === "fourD"
                ? "border-brand bg-brand text-white"
                : "border-border bg-surface text-ink-muted hover:bg-surface-muted",
            ].join(" ")}
          >
            {t("gameFourD")}
          </button>
          <button
            type="button"
            onClick={() => switchGame("toto")}
            className={[
              "rounded-2xl border px-4 py-3 text-center text-sm font-bold transition",
              game === "toto"
                ? "border-brand bg-brand text-white"
                : "border-border bg-surface text-ink-muted hover:bg-surface-muted",
            ].join(" ")}
          >
            {t("gameToto")}
          </button>
        </div>
      </div>

      {resultsError ? (
        <p className="text-sm text-danger">{resultsError}</p>
      ) : null}

      {game === "fourD" ? (
        <div className="space-y-3">
          <div className="space-y-4 rounded-xl border border-brand-soft-border bg-brand-soft/40 p-4">
            <div>
              <h3 className="font-semibold text-ink">{t("sectionCheck")}</h3>
              <p className="mt-1 text-sm text-ink-muted">{t("checkFourDHint")}</p>
            </div>

            <DrawSelect
              draws={fourDDraws}
              value={fourDDrawNo}
              onChange={(n) => {
                setFourDDrawNo(n);
                setFourDChecked(false);
              }}
              label={t("checkDrawLabel")}
            />

            {selectedFourD ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-ink">
                  {t("checkSelectedResults")}
                </p>
                <FourDDrawCard draw={selectedFourD} />
              </div>
            ) : (
              <p className="text-sm text-ink-subtle">{t("noResults")}</p>
            )}

            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-sm font-semibold text-ink">
                {t("checkYourNumbers")}
              </p>
              <p className="text-xs text-ink-subtle">{t("checkFourDBoardsLabel")}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {boards.map((value, index) => (
                  <label key={index} className="block space-y-1">
                    <span className="text-xs font-medium text-ink-subtle">
                      {t("checkFourDBoard", { n: index + 1 })}
                    </span>
                    <input
                      inputMode="numeric"
                      maxLength={4}
                      value={value}
                      onChange={(e) => updateBoard(index, e.target.value)}
                      placeholder="1234"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-lg tabular-nums text-ink"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink">{t("checkEntryLabel")}</p>
              <SegmentedButtons
                options={["ordinary", "ibet"] as const}
                value={entryType}
                onChange={(v) => {
                  setEntryType(v);
                  setFourDChecked(false);
                }}
                labelFor={(v) =>
                  v === "ordinary" ? t("entryOrdinary") : t("entryIbet")
                }
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink">{t("checkSizeLabel")}</p>
              <SegmentedButtons
                options={["big", "small"] as const}
                value={betSize}
                onChange={(v) => {
                  setBetSize(v);
                  setFourDChecked(false);
                }}
                labelFor={(v) => (v === "big" ? t("sizeBig") : t("sizeSmall"))}
              />
              <p className="text-xs text-ink-subtle">
                {betSize === "big" ? t("sizeHintBig") : t("sizeHintSmall")}
              </p>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-semibold text-ink">
                {t("checkStakeLabel")}
              </span>
              <input
                type="number"
                min={1}
                max={999}
                step={1}
                value={stake}
                onChange={(e) => {
                  const next = Math.max(
                    1,
                    Math.min(999, Number(e.target.value) || 1),
                  );
                  setStake(next);
                  setFourDChecked(false);
                }}
                className="w-28 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
              />
              <span className="block text-xs text-ink-subtle">
                {t("checkStakeHint")}
              </span>
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={filledBoardCount === 0 || !selectedFourD}
                onClick={() => setFourDChecked(true)}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-60"
              >
                {t("checkSubmit")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBoards(EMPTY_BOARDS());
                  setFourDChecked(false);
                }}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink-muted"
              >
                {t("checkClear")}
              </button>
            </div>

            {fourDChecked && fourDEstimates.length === 0 ? (
              <p className="text-sm text-ink-muted">{t("checkNoValidBoards")}</p>
            ) : null}

            {fourDEstimates.length > 0 ? (
              <div className="space-y-3">
                {fourDEstimates.map((estimate) => {
                  if (!estimate.ibetAllowed && estimate.entry === "ibet") {
                    return (
                      <div
                        key={estimate.number}
                        className="rounded-lg border border-danger-border bg-danger-soft p-3 text-sm text-danger"
                      >
                        <span className="font-mono font-bold">
                          {estimate.number}
                        </span>
                        {" — "}
                        {t("checkIbetBlocked")}
                      </div>
                    );
                  }
                  if (estimate.lines.length === 0) {
                    return (
                      <p
                        key={estimate.number}
                        className="text-sm text-ink-muted"
                      >
                        {t("checkFourDMiss", {
                          number: estimate.number,
                          date: estimate.draw.drawDateLabel,
                        })}
                      </p>
                    );
                  }
                  return (
                    <div
                      key={estimate.number}
                      className="space-y-2 rounded-lg border border-success-border bg-success-soft p-3"
                    >
                      <p className="text-sm font-semibold text-ink">
                        {t("checkWinTitle", {
                          number: estimate.number,
                          date: estimate.draw.drawDateLabel,
                        })}
                      </p>
                      <p className="text-xs text-ink-subtle">
                        {t("checkPattern", {
                          pattern: patternLabel(estimate.pattern),
                        })}
                      </p>
                      <ul className="space-y-1 text-sm text-ink">
                        {estimate.lines.map((line) => (
                          <li key={`${estimate.number}-${line.prize}-${line.winningNumber}`}>
                            {prizeLabel(line.prize)}
                            {estimate.entry === "ibet"
                              ? ` (${line.winningNumber})`
                              : ""}
                            {" — "}
                            {formatSgd(line.payout)}
                            <span className="text-xs text-ink-subtle">
                              {" "}
                              ({formatSgd(line.amountPerDollar)} × $
                              {estimate.stake})
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="font-bold text-ink">
                        {t("checkTotal", {
                          amount: formatSgd(estimate.total),
                        })}
                      </p>
                    </div>
                  );
                })}
                {fourDEstimates.length > 1 ? (
                  <p className="text-base font-bold text-ink">
                    {t("checkGrandTotal", {
                      amount: formatSgd(fourDGrandTotal),
                    })}
                  </p>
                ) : null}
              </div>
            ) : null}

            <p className="text-xs text-ink-subtle">{t("checkDisclaimer")}</p>
            <a
              href={LOTTERY_LINKS.fourDRules}
              target="_blank"
              rel="noopener noreferrer"
              className={EXTERNAL}
            >
              {t("linkFourDRules")}
            </a>
          </div>

          <AccordionSection
            id="generate"
            openId={openSection}
            onToggle={toggleSection}
            title={t("sectionGenerate")}
          >
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-ink">{t("periodTitle")}</h4>
              <SegmentedButtons
                options={PERIODS}
                value={period}
                onChange={setPeriod}
                labelFor={periodLabel}
              />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-ink">{t("modeTitle")}</h4>
              <SegmentedButtons
                options={MODES}
                value={mode}
                onChange={setMode}
                labelFor={modeLabel}
              />
              <p className="text-sm text-ink-muted">{modeHint}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={analysisLoading}
                onClick={() =>
                  setGenFourD(generateFourDFromAnalysis(analysisFourD, mode, 1))
                }
                className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {t("genOne")}
              </button>
              <button
                type="button"
                disabled={analysisLoading}
                onClick={() =>
                  setGenFourD(generateFourDFromAnalysis(analysisFourD, mode, 5))
                }
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-ink-muted disabled:opacity-60"
              >
                {t("genFive")}
              </button>
            </div>
            {genFourD.length > 0 ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {genFourD.map((n, index) => (
                    <span
                      key={`${n}-${index}`}
                      className="inline-flex min-w-[4.5rem] items-center justify-center rounded-lg bg-surface-muted px-3 py-2 font-mono text-lg font-bold tabular-nums text-ink"
                    >
                      {n}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => void copyText("4d", genFourD.join(" "))}
                  className="text-sm font-medium text-brand-strong underline"
                >
                  {copied === "4d" ? t("copied") : t("copy")}
                </button>
              </div>
            ) : null}
            <p className="text-sm text-ink-muted">
              {t("genPlayHint")}{" "}
              <a
                href={LOTTERY_LINKS.home}
                target="_blank"
                rel="noopener noreferrer"
                className={EXTERNAL}
              >
                {t("openSingaporePools")}
              </a>
            </p>
          </AccordionSection>

          <AccordionSection
            id="results"
            openId={openSection}
            onToggle={toggleSection}
            title={t("sectionResults")}
          >
            <a
              href={LOTTERY_LINKS.fourDResults}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-brand-strong underline"
            >
              {t("officialResults")}
            </a>
            {fourDDraws.length > 0 ? (
              <FourDHistory draws={fourDDraws} />
            ) : (
              <p className="text-sm text-ink-subtle">{t("noResults")}</p>
            )}
          </AccordionSection>

          <AccordionSection
            id="analysis"
            openId={openSection}
            onToggle={toggleSection}
            title={t("sectionAnalysis")}
          >
            <SegmentedButtons
              options={PERIODS}
              value={period}
              onChange={setPeriod}
              labelFor={periodLabel}
            />
            <p className="text-sm text-ink-muted">{t("analysisDisclaimer")}</p>
            {analysisLoading ? (
              <p className="text-sm text-ink-subtle">{t("analysisLoading")}</p>
            ) : null}
            {analysisError ? (
              <p className="text-sm text-danger">{analysisError}</p>
            ) : null}
            {analysis && !analysisLoading ? (
              <>
                <p className="text-sm text-ink-muted">
                  {t("analysisSampleFourD", {
                    count: analysis.fourD.sampleSize,
                    period: periodLabel(analysis.period),
                  })}
                </p>
                {analysis.fourD.capped ? (
                  <p className="text-xs text-ink-subtle">{t("analysisCapped")}</p>
                ) : null}
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-ink">{t("hotFourD")}</h5>
                  <FreqChips items={analysis.fourD.hot} empty={t("noResults")} />
                </div>
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-ink">{t("coldFourD")}</h5>
                  <FreqChips items={analysis.fourD.cold} empty={t("noResults")} />
                </div>
              </>
            ) : null}
          </AccordionSection>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-4 rounded-xl border border-brand-soft-border bg-brand-soft/40 p-4">
            <div>
              <h3 className="font-semibold text-ink">{t("sectionCheck")}</h3>
              <p className="mt-1 text-sm text-ink-muted">{t("checkTotoHint")}</p>
            </div>

            <DrawSelect
              draws={totoDraws}
              value={totoDrawNo}
              onChange={(n) => {
                setTotoDrawNo(n);
                setTotoChecked(false);
              }}
              label={t("checkDrawLabel")}
            />

            {selectedToto ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-ink">
                  {t("checkSelectedResults")}
                </p>
                <TotoDrawCard draw={selectedToto} />
              </div>
            ) : (
              <p className="text-sm text-ink-subtle">{t("noResults")}</p>
            )}

            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-sm font-semibold text-ink">{t("totoEntryLabel")}</p>
              <select
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
                value={totoEntry}
                onChange={(e) =>
                  setTotoEntryType(e.target.value as TotoEntryType)
                }
              >
                {TOTO_ENTRY_TYPES.map((entry) => (
                  <option key={entry} value={entry}>
                    {totoEntryLabel(entry)}
                    {entry !== "ordinary"
                      ? ` · ${totoEntryBoardCount(entry)} ${t("totoBoardsUnit")}`
                      : ""}
                  </option>
                ))}
              </select>
              <div className="rounded-lg border border-border bg-surface p-3 text-sm text-ink-muted">
                <p>{t(`totoInfo.${totoEntry}`)}</p>
                <p className="mt-1 text-xs text-ink-subtle">
                  {t("totoInfoBoards", {
                    boards: totoBoardsForEntry,
                    picks: totoPickNeed,
                  })}
                </p>
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-sm font-semibold text-ink">
                {t("checkYourNumbers")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TOTO_POOL.map((n) => {
                  const selected = totoPicks.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggleTotoPick(n)}
                      className={[
                        "inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold tabular-nums transition",
                        selected
                          ? "bg-brand text-white"
                          : "border border-border bg-surface text-ink-muted hover:bg-surface-muted",
                      ].join(" ")}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-ink-muted">
                {t("checkTotoPicked", {
                  count: totoPicks.length,
                  need: totoPickNeed,
                })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={totoPicks.length !== totoPickNeed || !selectedToto}
                onClick={() => setTotoChecked(true)}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {t("checkSubmit")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTotoPicks([]);
                  setTotoChecked(false);
                }}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink-muted"
              >
                {t("checkClear")}
              </button>
            </div>
            {totoCheck ? (
              <div className="space-y-2 rounded-lg border border-border bg-surface-muted p-3 text-sm text-ink">
                <p>
                  {t("checkTotoAgainst", {
                    date: totoCheck.draw.drawDateLabel,
                    draw: totoCheck.draw.drawNo,
                  })}
                </p>
                <p className="text-xs text-ink-subtle">
                  {totoEntryLabel(totoCheck.entry)} ·{" "}
                  {t("totoCheckedBoards", { count: totoCheck.boardCount })}
                </p>

                {totoOrdinaryDetail ? (
                  <>
                    <p>
                      {t("checkTotoMatched", {
                        count: totoOrdinaryDetail.matchCount,
                        numbers:
                          totoOrdinaryDetail.winningMatched.join(", ") || "—",
                      })}
                    </p>
                    <p>
                      {totoOrdinaryDetail.additionalMatched
                        ? t("checkTotoAdditionalYes", {
                            number: totoOrdinaryDetail.draw.additional ?? "",
                          })
                        : t("checkTotoAdditionalNo")}
                    </p>
                  </>
                ) : null}

                {totoCheck.bestGroup != null ? (
                  <p className="text-base font-bold text-success">
                    {t("checkTotoWon", { group: totoCheck.bestGroup })}
                  </p>
                ) : (
                  <p className="font-semibold text-ink">
                    {t("checkTotoNoPrize")}
                  </p>
                )}

                {totoCheck.entry !== "ordinary" &&
                totoCheck.winningBoardCount > 0 ? (
                  <ul className="space-y-0.5 text-sm text-ink-muted">
                    {([1, 2, 3, 4, 5, 6, 7] as const).map((g) => {
                      const count = totoCheck.groupCounts[g];
                      if (!count) return null;
                      return (
                        <li key={g}>
                          {t("checkTotoGroupBoards", {
                            group: g,
                            count,
                          })}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}

                {totoCheck.fixedPrizeTotal > 0 ? (
                  <p>
                    {t("checkTotoFixedPrize", {
                      amount: formatSgd(totoCheck.fixedPrizeTotal),
                    })}
                  </p>
                ) : totoCheck.bestGroup != null &&
                  totoCheck.bestGroup <= 4 ? (
                  <p className="text-xs text-ink-subtle">
                    {t("checkTotoPoolPrize")}
                  </p>
                ) : null}
              </div>
            ) : null}
            <p className="text-xs text-ink-subtle">{t("checkDisclaimer")}</p>
          </div>

          <AccordionSection
            id="generate"
            openId={openSection}
            onToggle={toggleSection}
            title={t("sectionGenerate")}
          >
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-ink">{t("periodTitle")}</h4>
              <SegmentedButtons
                options={PERIODS}
                value={period}
                onChange={setPeriod}
                labelFor={periodLabel}
              />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-ink">{t("modeTitle")}</h4>
              <SegmentedButtons
                options={MODES}
                value={mode}
                onChange={setMode}
                labelFor={modeLabel}
              />
              <p className="text-sm text-ink-muted">{modeHint}</p>
            </div>
            <button
              type="button"
              disabled={analysisLoading}
              onClick={() =>
                setGenToto(generateTotoFromAnalysis(analysisToto, mode))
              }
              className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {t("genToto")}
            </button>
            {genToto.length > 0 ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {genToto.map((n) => (
                    <span
                      key={n}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-sm font-bold tabular-nums text-brand-strong"
                    >
                      {n}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => void copyText("toto", genToto.join(", "))}
                  className="text-sm font-medium text-brand-strong underline"
                >
                  {copied === "toto" ? t("copied") : t("copy")}
                </button>
              </div>
            ) : null}
            <p className="text-sm text-ink-muted">
              {t("genPlayHint")}{" "}
              <a
                href={LOTTERY_LINKS.home}
                target="_blank"
                rel="noopener noreferrer"
                className={EXTERNAL}
              >
                {t("openSingaporePools")}
              </a>
            </p>
          </AccordionSection>

          <AccordionSection
            id="results"
            openId={openSection}
            onToggle={toggleSection}
            title={t("sectionResults")}
          >
            <a
              href={LOTTERY_LINKS.totoResults}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-brand-strong underline"
            >
              {t("officialResults")}
            </a>
            {totoDraws.length > 0 ? (
              <TotoHistory draws={totoDraws} />
            ) : (
              <p className="text-sm text-ink-subtle">{t("noResults")}</p>
            )}
          </AccordionSection>

          <AccordionSection
            id="analysis"
            openId={openSection}
            onToggle={toggleSection}
            title={t("sectionAnalysis")}
          >
            <SegmentedButtons
              options={PERIODS}
              value={period}
              onChange={setPeriod}
              labelFor={periodLabel}
            />
            <p className="text-sm text-ink-muted">{t("analysisDisclaimer")}</p>
            {analysisLoading ? (
              <p className="text-sm text-ink-subtle">{t("analysisLoading")}</p>
            ) : null}
            {analysisError ? (
              <p className="text-sm text-danger">{analysisError}</p>
            ) : null}
            {analysis && !analysisLoading ? (
              <>
                <p className="text-sm text-ink-muted">
                  {t("analysisSampleToto", {
                    count: analysis.toto.sampleSize,
                    period: periodLabel(analysis.period),
                  })}
                </p>
                {analysis.toto.capped ? (
                  <p className="text-xs text-ink-subtle">{t("analysisCapped")}</p>
                ) : null}
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-ink">{t("hotToto")}</h5>
                  <FreqChips items={analysis.toto.hot} empty={t("noResults")} />
                </div>
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-ink">{t("coldToto")}</h5>
                  <FreqChips items={analysis.toto.cold} empty={t("noResults")} />
                </div>
              </>
            ) : null}
          </AccordionSection>
        </div>
      )}
    </div>
  );
}
