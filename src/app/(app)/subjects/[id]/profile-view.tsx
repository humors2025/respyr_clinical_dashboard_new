"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProfileData } from "@/lib/profile";
import { BAND_META, SCORE_KEYS, SCORE_META, scoreBand, type ScoreKey } from "@/lib/scores";
import { ScoreTrendChart, type TrendPoint } from "@/components/profile/score-trend-chart";
import { InitialAvatar } from "@/components/brand-mark";
import { EmptyState, Panel } from "@/components/ui";

/** The biomarker shown alongside each score, mirroring the legacy tab behaviour. */
function biomarkerFor(test: ProfileData["tests"][number], key: ScoreKey): string {
  switch (key) {
    case "sugar":
      return test.acetonePpm != null ? `Acetone ${test.acetonePpm} ppm` : "Acetone —";
    case "gut":
      return test.hydrogenPpm != null ? `H₂ ${test.hydrogenPpm} ppm` : "H₂ —";
    case "liver":
      return test.ethanolPpm != null ? `Ethanol ${test.ethanolPpm} ppm` : "Ethanol —";
    case "respiratory":
      return test.fev1 != null ? `FEV1 ${test.fev1} L` : "FEV1 —";
  }
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProfileView({ data }: { data: ProfileData }) {
  const [tab, setTab] = useState<ScoreKey>("sugar");
  const { subject, tests } = data;

  // The chart reads left-to-right in time; the list below reads newest-first.
  const chartPoints: TrendPoint[] = useMemo(
    () =>
      [...tests]
        .reverse()
        .filter((t) => t.scores[tab] > 0)
        .map((t) => ({
          label: t.takenAt
            ? new Date(t.takenAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
            : "—",
          value: t.scores[tab],
        })),
    [tests, tab],
  );

  const latest = tests[0];

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <div>
        <Link
          href="/subjects"
          className="type-small inline-flex items-center gap-1.5 text-ink-3 transition-colors hover:text-blue"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to subjects
        </Link>
      </div>

      {data.degraded.length > 0 && (
        <p className="type-small rounded-input border border-orange/25 bg-[#fff5eb] px-4 py-2.5 text-orange">
          Some data could not be loaded ({data.degraded.join(", ")}). This page may be incomplete.
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
        {/* ---------- profile card ---------- */}
        <Panel className="h-fit p-6">
          <div className="flex flex-col items-center text-center">
            <InitialAvatar name={subject.name} size={72} />
            <h1 className="type-section mt-3 text-ink">{subject.name}</h1>
            <p className="type-small mt-1 text-ink-3">
              {subject.age != null ? `${subject.age} years` : "Age unknown"}
              {subject.gender && ` · ${subject.gender === "M" ? "Male" : "Female"}`}
            </p>
          </div>

          <dl className="mt-6 flex flex-col">
            {(
              [
                ["Subject ID", subject.id],
                ["Height", subject.height != null ? `${subject.height} cm` : "—"],
                ["Weight", subject.weight != null ? `${subject.weight} kg` : "—"],
                ["BMI", subject.bmi ?? "—"],
                ["BMR", subject.bmr != null ? `${subject.bmr} kcal/day` : "—"],
                ["Tests taken", tests.length],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0"
              >
                <dt className="type-small text-ink-3">{label}</dt>
                <dd className="type-label text-right text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          {latest && (
            <div className="mt-5 rounded-input border border-line bg-surface p-3.5">
              <p className="type-micro font-normal text-ink-3">Latest test</p>
              <p className="type-small mt-0.5 text-ink-2">{formatDateTime(latest.takenAt)}</p>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {SCORE_KEYS.map((key) => {
                  const v = latest.scores[key];
                  return (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <span className="type-micro font-normal text-ink-3">
                        {SCORE_META[key].label}
                      </span>
                      <span
                        className="type-micro font-semibold tabular-nums"
                        style={{ color: v > 0 ? BAND_META[scoreBand(v)].color : "var(--color-ink-4)" }}
                      >
                        {v > 0 ? `${Math.round(v)}%` : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Panel>

        {/* ---------- trends + history ---------- */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Score">
            {SCORE_KEYS.map((key) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(key)}
                  className={`type-body rounded-input border px-4 py-2 transition-colors ${
                    active
                      ? "border-blue bg-blue-light font-medium text-blue"
                      : "border-line bg-card text-ink-2 hover:border-blue hover:text-blue"
                  }`}
                >
                  {SCORE_META[key].label} score
                </button>
              );
            })}
          </div>

          <Panel className="p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="type-section text-ink">{SCORE_META[tab].label} score over time</h2>
              <p className="type-small text-ink-3">{SCORE_META[tab].biomarker}</p>
            </div>
            <div className="mt-3">
              <ScoreTrendChart points={chartPoints} label={`${SCORE_META[tab].label} score`} />
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="type-section text-ink">Test history</h2>
              <span className="type-small text-ink-3">
                {tests.length} test{tests.length === 1 ? "" : "s"}
              </span>
            </div>

            {tests.length === 0 ? (
              <EmptyState
                title="No tests recorded"
                hint="Results appear here once this subject takes a screening on the Respyr device."
              />
            ) : (
              <ul className="divide-y divide-line">
                {tests.map((test, i) => {
                  const value = test.scores[tab];
                  const band = scoreBand(value);
                  return (
                    <li key={`${test.rawDttm}-${i}`}>
                      <Link
                        href={`/subjects/${encodeURIComponent(subject.id)}/report?t=${encodeURIComponent(test.rawDttm)}`}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-surface"
                      >
                      <div className="min-w-[180px] flex-1">
                        <p className="type-body text-ink">{formatDateTime(test.takenAt)}</p>
                        <p className="type-micro font-normal text-ink-3">
                          {biomarkerFor(test, tab)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: value > 0 ? BAND_META[band].color : "var(--color-ink-4)" }}
                        />
                        <span className="type-section text-ink tabular-nums">
                          {value > 0 ? `${Math.round(value)}%` : "—"}
                        </span>
                        <span
                          className="type-label"
                          style={{ color: value > 0 ? BAND_META[band].color : "var(--color-ink-4)" }}
                        >
                          {value > 0 ? BAND_META[band].label : ""}
                        </span>
                        <svg className="text-ink-4" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="m9 6 6 6-6 6" />
                        </svg>
                      </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
