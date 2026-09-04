import type { LungFlowPoint } from "@/lib/report";

/**
 * Expiratory flow vs time, derived from the device's raw chamber pressures.
 * Server-rendered SVG so html2canvas captures it in the PDF.
 */
export function LungFlowChart({ points }: { points: LungFlowPoint[] }) {
  const W = 700;
  const H = 220;
  const PAD = { top: 12, right: 12, bottom: 32, left: 44 };
  const pw = W - PAD.left - PAD.right;
  const ph = H - PAD.top - PAD.bottom;

  if (points.length < 2) return null;

  const maxT = Math.max(...points.map((p) => p.t));
  const maxF = Math.max(...points.map((p) => p.flow), 1);
  const minF = Math.min(...points.map((p) => p.flow), 0);
  const span = maxF - minF || 1;

  const x = (t: number) => PAD.left + (t / maxT) * pw;
  const y = (f: number) => PAD.top + ph - ((f - minF) / span) * ph;
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t)},${y(p.flow)}`).join(" ");

  const ticks = 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Expiratory flow over time">
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const f = minF + (span * i) / ticks;
        return (
          <g key={i}>
            <line x1={PAD.left} x2={PAD.left + pw} y1={y(f)} y2={y(f)} stroke="var(--color-line)" strokeWidth="1" strokeDasharray="4 5" />
            <text x={PAD.left - 7} y={y(f) + 3} textAnchor="end" className="fill-[var(--color-ink-4)] text-[9px]">
              {f.toFixed(1)}
            </text>
          </g>
        );
      })}
      <path d={line} fill="none" stroke="var(--color-blue)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {Array.from({ length: 5 }, (_, i) => {
        const t = (maxT * i) / 4;
        return (
          <text key={i} x={x(t)} y={H - 12} textAnchor="middle" className="fill-[var(--color-ink-4)] text-[9px]">
            {t.toFixed(1)}s
          </text>
        );
      })}
      <text x={12} y={H / 2} textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`} className="fill-[var(--color-ink-3)] text-[9px]">
        Flow (L/s)
      </text>
    </svg>
  );
}
