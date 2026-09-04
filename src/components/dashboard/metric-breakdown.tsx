"use client";

import type { MetricSummary } from "@/lib/dashboard";
import { BAND_META, SCORE_META, type Band, type ScoreKey } from "@/lib/scores";
import { DistributionBar, EmptyState, Panel, PanelHeader } from "@/components/ui";

export interface MetricFilter {
  metric: ScoreKey | null;
  band: Band | null;
}

/**
 * Per-parameter averages and band distribution. Clicking a count pill filters
 * the patient list beside it — the fastest route from "gut looks bad" to
 * "which patients".
 */
export function MetricBreakdown({
  metrics,
  filter,
  onFilterChange,
  hasData,
}: {
  metrics: MetricSummary[];
  filter: MetricFilter;
  onFilterChange: (next: MetricFilter) => void;
  hasData: boolean;
}) {
  return (
    <Panel>
      <PanelHeader
        title="Health parameters"
        subtitle="Average and spread for each breath marker"
        action={
          filter.metric || filter.band ? (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => onFilterChange({ metric: null, band: null })}
            >
              Clear filter
            </button>
          ) : undefined
        }
      />

      {!hasData ? (
        <EmptyState
          title="No tests recorded"
          hint="Pick another date, or run a screening from the Respyr app to populate this view."
        />
      ) : (
        <div className="divide-y divide-line">
          {metrics.map((metric) => {
            const total = metric.counts.good + metric.counts.fair + metric.counts.poor;
            return (
              <div
                key={metric.key}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-5 py-4 sm:grid-cols-[140px_64px_1fr_auto]"
              >
                <div>
                  <p className="type-body font-medium text-ink">{metric.label}</p>
                  <p className="type-micro font-normal text-ink-4">
                    {SCORE_META[metric.key].biomarker}
                  </p>
                </div>

                <p className="type-section text-right text-ink tabular-nums sm:text-left">
                  {total ? Math.round(metric.average) : "—"}
                  {total > 0 && <span className="type-small text-ink-4">%</span>}
                </p>

                <div className="col-span-2 sm:col-span-1">
                  <DistributionBar counts={metric.counts} />
                </div>

                <div className="col-span-2 flex flex-wrap gap-1.5 sm:col-span-1 sm:justify-end">
                  {(Object.keys(BAND_META) as Band[]).map((band) => {
                    const count = metric.counts[band];
                    const active = filter.metric === metric.key && filter.band === band;
                    return (
                      <button
                        key={band}
                        type="button"
                        disabled={count === 0}
                        onClick={() =>
                          onFilterChange(
                            active
                              ? { metric: null, band: null }
                              : { metric: metric.key, band },
                          )
                        }
                        aria-pressed={active}
                        className="type-micro inline-flex items-center gap-1.5 rounded-badge border px-2 py-1 tabular-nums transition-all disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                          background: active ? BAND_META[band].color : BAND_META[band].tint,
                          color: active ? "#fff" : BAND_META[band].color,
                          borderColor: active ? BAND_META[band].color : "transparent",
                        }}
                      >
                        {count} {BAND_META[band].label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
