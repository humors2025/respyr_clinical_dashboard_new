import { BAND_META, type Band } from "@/lib/scores";

export function Panel({
  children,
  className = "",
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section className={`panel ${className}`} {...rest}>
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div>
        <h2 className="type-section text-ink">{title}</h2>
        {subtitle && <p className="type-small mt-0.5 text-ink-3">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Compact score chip, e.g. `S 82`. */
export function ScorePill({ letter, value, band }: { letter: string; value: number; band: Band }) {
  const meta = BAND_META[band];
  return (
    <span
      className="type-micro inline-flex items-center gap-1 rounded-badge px-1.5 py-1 tabular-nums"
      style={{ background: meta.tint, color: meta.color }}
      title={`${meta.label} — ${Math.round(value)}%`}
    >
      <span className="opacity-70">{letter}</span>
      {Math.round(value)}
    </span>
  );
}

export function BandLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {(Object.keys(BAND_META) as Band[]).map((band) => (
        <span key={band} className="type-micro flex items-center gap-1.5 font-normal text-ink-3">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: BAND_META[band].color }}
          />
          {BAND_META[band].label}
          <span className="text-ink-4">{BAND_META[band].range}</span>
        </span>
      ))}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-4)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
          <path d="M14 3v5h5" />
        </svg>
      </div>
      <p className="type-body mt-3 font-medium text-ink-2">{title}</p>
      {hint && <p className="type-small mt-1 max-w-[36ch] text-ink-4">{hint}</p>}
    </div>
  );
}
