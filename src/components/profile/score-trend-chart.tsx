"use client";

import { useId, useState } from "react";
import { BAND_META, scoreBand } from "@/lib/scores";

export interface TrendPoint {
  label: string;
  value: number;
}

const W = 720;
const H = 260;
const PAD = { top: 16, right: 16, bottom: 34, left: 34 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

/**
 * Score-over-time line chart.
 *
 * Drawn as plain SVG rather than pulling in a charting library — one series on
 * a fixed 0–100 axis does not justify the bundle. The good/fair/poor bands are
 * shaded behind the line so a reader can see which band a point sits in without
 * consulting the legend.
 */
export function ScoreTrendChart({ points, label }: { points: TrendPoint[]; label: string }) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center">
        <p className="type-small text-ink-4">No tests to chart yet.</p>
      </div>
    );
  }

  const x = (i: number) =>
    PAD.left + (points.length === 1 ? PLOT_W / 2 : (i / (points.length - 1)) * PLOT_W);
  const y = (v: number) => PAD.top + PLOT_H - (Math.max(0, Math.min(100, v)) / 100) * PLOT_H;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${PAD.top + PLOT_H} L${x(0)},${PAD.top + PLOT_H} Z`;

  // Thin out x labels so they never collide.
  const step = Math.max(1, Math.ceil(points.length / 8));

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`${label} over time, ${points.length} tests`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-blue)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--color-blue)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Score bands: poor 0–69, fair 70–79, good 80–100 */}
        {(
          [
            [80, 100, BAND_META.good.color],
            [70, 80, BAND_META.fair.color],
            [0, 70, BAND_META.poor.color],
          ] as const
        ).map(([from, to, color]) => (
          <rect
            key={from}
            x={PAD.left}
            y={y(to)}
            width={PLOT_W}
            height={y(from) - y(to)}
            fill={color}
            opacity="0.06"
          />
        ))}

        {/* Y gridlines and labels */}
        {[0, 20, 40, 60, 80, 100].map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={PAD.left + PLOT_W}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--color-line)"
              strokeWidth="1"
              strokeDasharray={v === 0 ? undefined : "4 5"}
            />
            <text
              x={PAD.left - 8}
              y={y(v) + 3.5}
              textAnchor="end"
              className="fill-[var(--color-ink-4)] text-[10px]"
            >
              {v}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke="var(--color-blue)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => {
          const band = scoreBand(p.value);
          const active = hover === i;
          return (
            <g key={`${p.label}-${i}`}>
              {/* Generous invisible hit area — the visible dot is only 4px. */}
              <rect
                x={x(i) - PLOT_W / (points.length * 2) - 6}
                y={PAD.top}
                width={PLOT_W / points.length + 12}
                height={PLOT_H}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
              <circle
                cx={x(i)}
                cy={y(p.value)}
                r={active ? 6 : 4}
                fill="#fff"
                stroke={BAND_META[band].color}
                strokeWidth="2.5"
              />
            </g>
          );
        })}

        {/* X labels */}
        {points.map((p, i) =>
          i % step === 0 || i === points.length - 1 ? (
            <text
              key={`x-${i}`}
              x={x(i)}
              y={H - 12}
              textAnchor="middle"
              className="fill-[var(--color-ink-4)] text-[10px]"
            >
              {p.label}
            </text>
          ) : null,
        )}
      </svg>

      {hover != null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-[6px] bg-dark px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap text-white"
          style={{
            left: `${(x(hover) / W) * 100}%`,
            top: `${(y(points[hover].value) / H) * 100}%`,
            marginTop: "-8px",
          }}
        >
          {points[hover].label} · {Math.round(points[hover].value)}%
        </div>
      )}
    </div>
  );
}
