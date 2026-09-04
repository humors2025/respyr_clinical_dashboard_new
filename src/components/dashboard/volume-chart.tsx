"use client";

import { useMemo, useState } from "react";
import { EmptyState, Panel, PanelHeader } from "@/components/ui";

type Grouping = "day" | "week" | "month";

const GROUPINGS: { value: Grouping; label: string }[] = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
];

interface Bucket {
  label: string;
  title: string;
  count: number;
}

function groupSeries(series: { day: string; count: number }[], grouping: Grouping): Bucket[] {
  const map = new Map<string, { label: string; title: string; count: number; sort: number }>();

  for (const { day, count } of series) {
    const [y, m, d] = day.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (Number.isNaN(date.getTime())) continue;

    let key: string;
    let label: string;
    let title: string;
    let sort: number;

    if (grouping === "week") {
      const start = new Date(date);
      start.setDate(start.getDate() - start.getDay());
      key = start.toISOString().slice(0, 10);
      label = start.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      title = `Week of ${start.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;
      sort = start.getTime();
    } else if (grouping === "month") {
      key = `${y}-${m}`;
      label = date.toLocaleDateString("en-GB", { month: "short" });
      title = date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      sort = new Date(y, m - 1, 1).getTime();
    } else {
      key = day;
      label = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      title = date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      sort = date.getTime();
    }

    const existing = map.get(key);
    if (existing) existing.count += count;
    else map.set(key, { label, title, count, sort });
  }

  return Array.from(map.values())
    .sort((a, b) => a.sort - b.sort)
    .slice(-24)
    .map(({ label, title, count }) => ({ label, title, count }));
}

/**
 * Test volume over time. Hand-drawn CSS bars rather than a charting library —
 * four colours and one axis do not justify 200 KB of JavaScript.
 */
export function VolumeChart({ series }: { series: { day: string; count: number }[] }) {
  const [grouping, setGrouping] = useState<Grouping>("day");
  const buckets = useMemo(() => groupSeries(series, grouping), [series, grouping]);
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const total = buckets.reduce((sum, b) => sum + b.count, 0);

  return (
    <Panel>
      <PanelHeader
        title="Test volume"
        subtitle={total > 0 ? `${total} test${total === 1 ? "" : "s"} in this window` : undefined}
        action={
          <div
            className="flex gap-0.5 rounded-input border border-line bg-surface p-0.5"
            role="group"
            aria-label="Group volume by"
          >
            {GROUPINGS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGrouping(g.value)}
                aria-pressed={grouping === g.value}
                className={`type-micro rounded-[6px] px-2.5 py-1.5 transition-colors ${
                  grouping === g.value
                    ? "bg-card text-ink shadow-[0_1px_2px_rgba(37,37,37,0.08)]"
                    : "text-ink-3 hover:text-ink-2"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        }
      />

      {buckets.length === 0 ? (
        <EmptyState
          title="No test history yet"
          hint="Volume is drawn from the clinic's rolling test history and fills in as screenings are recorded."
        />
      ) : (
        <div className="p-5">
          <div className="flex h-[188px] items-end gap-[3px]" role="img" aria-label={`Test volume, ${grouping}`}>
            {buckets.map((bucket, i) => (
              <div key={`${bucket.label}-${i}`} className="group relative flex h-full flex-1 flex-col justify-end">
                <div
                  className="w-full rounded-t-[4px] transition-all duration-300"
                  style={{
                    height: `${Math.max((bucket.count / max) * 100, bucket.count > 0 ? 4 : 1.5)}%`,
                    background: bucket.count > 0 ? "var(--color-blue)" : "var(--color-line)",
                  }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-[6px] bg-dark px-2 py-1 text-[10px] font-medium text-white group-hover:block">
                  {bucket.count} test{bucket.count === 1 ? "" : "s"} · {bucket.title}
                </div>
              </div>
            ))}
          </div>
          {/*
            Only label every nth bar. At 40+ daily buckets the columns are a
            few pixels wide, so labelling all of them renders "7…" ellipses
            rather than dates.
          */}
          <div className="mt-2 flex gap-[3px]">
            {buckets.map((bucket, i) => {
              const step = Math.max(1, Math.ceil(buckets.length / 6));
              const show = i % step === 0 || i === buckets.length - 1;
              return (
                <span
                  key={`${bucket.label}-label-${i}`}
                  className="type-micro flex-1 whitespace-nowrap text-center font-normal text-ink-4"
                >
                  {show ? bucket.label : ""}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </Panel>
  );
}
