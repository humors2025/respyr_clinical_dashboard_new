import { BAND_META, scoreBand } from "@/lib/scores";

/**
 * Compact score trend for the printed report. Server-rendered plain SVG — the
 * report is rasterised by html2canvas, which cannot wait for a client chart
 * library to mount.
 */
export function MiniTrendChart({ points }: { points: { label: string; value: number }[] }) {
  const W = 700;
  const H = 150;
  const PAD = { top: 10, right: 10, bottom: 22, left: 28 };
  const pw = W - PAD.left - PAD.right;
  const ph = H - PAD.top - PAD.bottom;

  const usable = points.filter((p) => Number.isFinite(p.value));
  if (usable.length < 2) return null;

  const x = (i: number) => PAD.left + (i / (usable.length - 1)) * pw;
  const y = (v: number) => PAD.top + ph - (Math.max(0, Math.min(100, v)) / 100) * ph;
  const line = usable.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Score trend">
      {([[80, 100, BAND_META.good.color], [70, 80, BAND_META.fair.color], [0, 70, BAND_META.poor.color]] as const).map(
        ([from, to, color]) => (
          <rect key={from} x={PAD.left} y={y(to)} width={pw} height={y(from) - y(to)} fill={color} opacity="0.07" />
        ),
      )}
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line x1={PAD.left} x2={PAD.left + pw} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeWidth="1" />
          <text x={PAD.left - 6} y={y(v) + 3} textAnchor="end" className="fill-[var(--color-ink-4)] text-[9px]">
            {v}
          </text>
        </g>
      ))}
      <path d={line} fill="none" stroke="var(--color-blue)" strokeWidth="2" strokeLinejoin="round" />
      {usable.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r="3.5" fill="#fff" stroke={BAND_META[scoreBand(p.value)].color} strokeWidth="2" />
      ))}
      {usable.map((p, i) => (
        <text key={`l-${i}`} x={x(i)} y={H - 6} textAnchor="middle" className="fill-[var(--color-ink-4)] text-[9px]">
          {p.label}
        </text>
      ))}
    </svg>
  );
}
