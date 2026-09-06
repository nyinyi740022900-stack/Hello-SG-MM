import { getTranslations } from "next-intl/server";
import { getSgConditions, uvBand, type PsiBand, type UvBand } from "@/lib/sgEnvironment";

/**
 * Live weather, haze and UV for Singapore.
 *
 * This is the one module that serves every resident equally, not just Myanmar
 * workers — but it earns its place at the top for them specifically: a
 * construction or shipyard worker plans their day around rain, haze and sun in
 * a way an office worker does not. When PSI or UV crosses into harmful
 * territory we say what to do about it, rather than just showing a number.
 */

const PSI_STYLE: Record<PsiBand, string> = {
  good: "text-brand-strong",
  moderate: "text-ink",
  unhealthy: "text-warning",
  very_unhealthy: "text-danger",
  hazardous: "text-danger",
};

const UV_STYLE: Record<UvBand, string> = {
  low: "text-brand-strong",
  moderate: "text-ink",
  high: "text-warning",
  very_high: "text-danger",
  extreme: "text-danger",
};

export default async function SgConditionsBar() {
  const t = await getTranslations("conditions");
  const { weather, psi, uvIndex, hasAny } = await getSgConditions();

  // NEA was unreachable this render — show nothing rather than an empty shell.
  if (!hasAny) return null;

  const uv = uvIndex === null ? null : { value: uvIndex, band: uvBand(uvIndex) };

  const showHazeAdvice =
    psi !== null && (psi.band === "unhealthy" || psi.band === "very_unhealthy" || psi.band === "hazardous");
  const showUvAdvice = uv !== null && (uv.band === "very_high" || uv.band === "extreme");

  return (
    <section
      aria-label={t("title")}
      className="rounded-2xl border border-border bg-surface p-4"
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {weather ? (
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-ink">{weather.forecast}</span>
            <span className="text-sm tabular-nums text-ink-muted">
              {t("tempRange", { low: weather.tempLow, high: weather.tempHigh })}
            </span>
          </div>
        ) : null}

        {psi ? (
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              {t("psiLabel")}
            </span>
            <span className={`text-sm font-bold tabular-nums ${PSI_STYLE[psi.band]}`}>
              {psi.national}
            </span>
            <span className={`text-xs ${PSI_STYLE[psi.band]}`}>
              {t(`psiBand.${psi.band}`)}
            </span>
          </div>
        ) : null}

        {uv ? (
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              {t("uvLabel")}
            </span>
            <span className={`text-sm font-bold tabular-nums ${UV_STYLE[uv.band]}`}>
              {uv.value}
            </span>
            <span className={`text-xs ${UV_STYLE[uv.band]}`}>{t(`uvBand.${uv.band}`)}</span>
          </div>
        ) : null}

        <a
          href="https://data.gov.sg/open-data-licence"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-ink-subtle underline decoration-dotted underline-offset-2 hover:text-brand"
        >
          {t("source")}
        </a>
      </div>

      {/* The Singapore Open Data Licence permits commercial reuse and
          adaptation, but only on condition that the source is acknowledged.
          Naming NEA alone does not satisfy it — the licence has to be named. */}
      <p className="mt-2 text-[11px] leading-relaxed text-ink-subtle">{t("licence")}</p>

      {showHazeAdvice ? (
        <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
          {t("hazeAdvice")}
        </p>
      ) : null}
      {showUvAdvice ? (
        <p className="mt-2 rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">
          {t("uvAdvice")}
        </p>
      ) : null}
    </section>
  );
}
