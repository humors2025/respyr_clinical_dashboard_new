"use client";

import { useState } from "react";
import type { SegmentCell } from "@/lib/dashboard";
import { AGE_BUCKETS, BAND_META, SCORE_KEYS, SCORE_META, scoreBand, type ScoreKey } from "@/lib/scores";
import { EmptyState, Panel, PanelHeader } from "@/components/ui";

type Metric = ScoreKey | "overall";

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: "overall", label: "Overall" },
  ...SCORE_KEYS.map((k) => ({ value: k as Metric, label: SCORE_META[k].label })),
];

/**
 * Average score by gender × age band. Reveals cohorts that a single headline
 * number hides — e.g. respiratory scores dropping only in men over 50.
 */
export function SegmentHeatmap({ segments, hasData }: { segments: SegmentCell[]; hasData: boolean }) {
  const [metric, setMetric] = useState<Metric>("overall");
  const [selected, setSelected] = useState<string | null>(null);

  const cellFor = (gender: "M" | "F", bucket: number) =>
    segments.find((s) => s.gender === gender && s.bucket === bucket);

  const selectedCell = selected
    ? segments.find((s) => `${s.gender}-${s.bucket}` === selected)
    : null;

  return (
    <Panel>
      <PanelHeader
        title="Cohort analysis"
        subtitle="Average score by gender and age band"
        action={
          <label className="flex items-center gap-2">
            <span className="sr-only">Metric</span>
            <select
              value={metric}
              onChange={(e) => {
                setMetric(e.target.value as Metric);
                setSelected(null);
              }}
              className="type-small h-9 cursor-pointer rounded-input border border-line bg-card px-3 text-ink-2 outline-none transition-colors focus:border-blue focus:ring-3 focus:ring-blue-light"
            >
              {METRIC_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        }
      />

      {!hasData ? (
        <EmptyState title="No cohort data" hint="Cohorts appear once tests are recorded for this date." />
      ) : (
        <div className="p-5">
          <div className="overflow-x-auto">
            <div className="min-w-[460px]">
              {/* Column headers */}
              <div className="grid grid-cols-[76px_repeat(5,1fr)] gap-1.5">
                <div />
                {AGE_BUCKETS.map((b) => (
                  <div key={b.label} className="type-micro pb-1 text-center font-normal text-ink-3">
                    {b.label} yrs
                  </div>
                ))}
              </div>

              {(["F", "M"] as const).map((gender) => (
                <div key={gender} className="grid grid-cols-[76px_repeat(5,1fr)] gap-1.5 pb-1.5">
                  <div className="type-label flex items-center gap-2 text-ink-2">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[11px]"
                      style={
                        gender === "F"
                          ? { background: "#FCE7F3", color: "#BE185D" }
                          : { background: "var(--color-blue-light)", color: "#1E40AF" }
                      }
                      aria-hidden
                    >
                      {gender === "F" ? "♀" : "♂"}
                    </span>
                    {gender === "F" ? "Female" : "Male"}
                  </div>

                  {AGE_BUCKETS.map((bucket, i) => {
                    const cell = cellFor(gender, i);
                    const key = `${gender}-${i}`;
                    if (!cell || cell.count === 0) {
                      return (
                        <div
                          key={key}
                          className="type-micro flex h-[62px] flex-col items-center justify-center rounded-input border border-dashed border-line font-normal text-ink-4"
                        >
                          —
                        </div>
                      );
                    }
                    const value = cell.averages[metric];
                    const band = scoreBand(value);
                    const active = selected === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelected(active ? null : key)}
                        aria-pressed={active}
                        aria-label={`${gender === "F" ? "Female" : "Male"}, ${bucket.label} years: ${Math.round(value)} percent, ${cell.count} patients`}
                        className="flex h-[62px] flex-col items-center justify-center rounded-input border transition-all hover:scale-[1.02]"
                        style={{
                          background: BAND_META[band].tint,
                          borderColor: active ? BAND_META[band].color : "transparent",
                          boxShadow: active ? `0 0 0 2px ${BAND_META[band].color}33` : "none",
                        }}
                      >
                        <span
                          className="text-[17px] font-semibold tracking-[-0.34px] tabular-nums"
                          style={{ color: BAND_META[band].color }}
                        >
                          {Math.round(value)}
                        </span>
                        <span className="type-micro font-normal text-ink-3">
                          {cell.count} pt{cell.count === 1 ? "" : "s"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {selectedCell && (
            <div className="animate-rise mt-4 rounded-input border border-line bg-surface p-4">
              <p className="type-label text-ink">
                {selectedCell.gender === "F" ? "Female" : "Male"} ·{" "}
                {AGE_BUCKETS[selectedCell.bucket].label} yrs
                <span className="ml-2 font-normal text-ink-3">
                  {selectedCell.count} patient{selectedCell.count === 1 ? "" : "s"}
                </span>
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {SCORE_KEYS.map((key) => {
                  const v = selectedCell.averages[key];
                  return (
                    <div key={key}>
                      <p className="type-micro font-normal text-ink-3">{SCORE_META[key].label}</p>
                      <p
                        className="text-[16px] font-semibold tracking-[-0.32px] tabular-nums"
                        style={{ color: v > 0 ? BAND_META[scoreBand(v)].color : "var(--color-ink-4)" }}
                      >
                        {v > 0 ? `${Math.round(v)}%` : "—"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
