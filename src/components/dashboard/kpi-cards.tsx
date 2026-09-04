import type { DashboardData } from "@/lib/dashboard";
import { BAND_META } from "@/lib/scores";

function Card({
  label,
  icon,
  tint,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  tint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="type-label text-ink-3">{label}</span>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-input"
          style={{ background: tint }}
          aria-hidden
        >
          {icon}
        </span>
      </div>
      {children}
    </div>
  );
}

export function KpiCards({ data }: { data: DashboardData }) {
  const { totals, allowance, demographics, concern } = data;
  const quotaPct =
    allowance && allowance.total > 0
      ? Math.min(100, Math.max(0, (allowance.used / allowance.total) * 100))
      : 0;
  const quotaNearLimit = quotaPct >= 90;
  const cohort = concern.healthy + concern.mild + concern.serious;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Subjects onboarded */}
      <Card
        label="Subjects onboarded"
        tint="var(--color-blue-light)"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="9" cy="8" r="3.2" />
            <path d="M3 20v-1c0-2.5 2.4-4.2 6-4.2s6 1.7 6 4.2v1M16.5 5.2a3.2 3.2 0 0 1 0 5.6M18 14.4c2 .6 3 1.9 3 3.6V19" />
          </svg>
        }
      >
        <p className="mt-3 text-[30px] font-semibold tracking-[-0.6px] text-ink tabular-nums">
          {totals.onboarded.toLocaleString()}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-3">
          <span className="type-micro flex items-center gap-1.5 font-normal text-ink-3">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-light text-blue">
              ♂
            </span>
            <b className="font-semibold text-ink-2">{demographics.male}</b> Male
            <span className="text-ink-4">{demographics.malePct}%</span>
          </span>
          <span className="type-micro flex items-center gap-1.5 font-normal text-ink-3">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FCE7F3] text-[#BE185D]">
              ♀
            </span>
            <b className="font-semibold text-ink-2">{demographics.female}</b> Female
            <span className="text-ink-4">{demographics.femalePct}%</span>
          </span>
        </div>
      </Card>

      {/* Test quota */}
      <Card
        label="Tests used"
        tint="var(--color-green-light)"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 11.5 11 13.5 15.5 9" />
            <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
            <path d="M8 2.5v4M16 2.5v4" />
          </svg>
        }
      >
        {allowance ? (
          <>
            <p className="mt-3 text-[30px] font-semibold tracking-[-0.6px] text-ink tabular-nums">
              {allowance.used.toLocaleString()}
              <span className="text-[15px] font-medium text-ink-4">
                /{allowance.total.toLocaleString()}
              </span>
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${quotaPct}%`,
                  background: quotaNearLimit ? "var(--color-red)" : "var(--color-green)",
                }}
              />
            </div>
            <p className="type-micro mt-auto pt-2 font-normal text-ink-3">
              {Math.max(0, allowance.total - allowance.used).toLocaleString()} remaining
              {quotaNearLimit && <span className="ml-1.5 text-red">· near limit</span>}
            </p>
          </>
        ) : (
          <p className="mt-3 text-[30px] font-semibold tracking-[-0.6px] text-ink-4">—</p>
        )}
      </Card>

      {/* Average score for the selected day */}
      <Card
        label="Average score"
        tint="var(--color-amber-light)"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 17.5 9 11l4 4 7.5-7.5" />
            <path d="M15 7.5h5.5V13" />
          </svg>
        }
      >
        <p className="mt-3 text-[30px] font-semibold tracking-[-0.6px] text-ink tabular-nums">
          {totals.testsOnDate ? Math.round(totals.averageScore) : "—"}
          {totals.testsOnDate > 0 && (
            <span className="text-[15px] font-medium text-ink-4">%</span>
          )}
        </p>
        <p className="type-micro mt-auto pt-3 font-normal text-ink-3">
          Across {totals.testsOnDate} test{totals.testsOnDate === 1 ? "" : "s"} on this date
        </p>
      </Card>

      {/* Concern mix */}
      <Card
        label="Concern mix"
        tint="#F3E8FF"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7E22CE" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 3.5 20 8v5c0 4.4-3.4 7-8 7.5-4.6-.5-8-3.1-8-7.5V8Z" />
            <path d="M12 9v4M12 16h.01" />
          </svg>
        }
      >
        {cohort === 0 ? (
          <p className="mt-3 text-[30px] font-semibold tracking-[-0.6px] text-ink-4">—</p>
        ) : (
          <>
            <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-surface">
              {concern.healthy > 0 && (
                <div style={{ width: `${(concern.healthy / cohort) * 100}%`, background: BAND_META.good.color }} />
              )}
              {concern.mild > 0 && (
                <div style={{ width: `${(concern.mild / cohort) * 100}%`, background: BAND_META.fair.color }} />
              )}
              {concern.serious > 0 && (
                <div style={{ width: `${(concern.serious / cohort) * 100}%`, background: BAND_META.poor.color }} />
              )}
            </div>
            <dl className="mt-3 flex flex-col gap-1.5">
              {(
                [
                  ["Healthy", concern.healthy, BAND_META.good.color],
                  ["Mild concern", concern.mild, BAND_META.fair.color],
                  ["Needs attention", concern.serious, BAND_META.poor.color],
                ] as const
              ).map(([label, count, color]) => (
                <div key={label} className="type-micro flex items-center gap-2 font-normal">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                  <dt className="text-ink-3">{label}</dt>
                  <dd className="ml-auto font-semibold text-ink-2 tabular-nums">{count}</dd>
                  <dd className="w-9 text-right text-ink-4 tabular-nums">
                    {Math.round((count / cohort) * 100)}%
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </Card>
    </div>
  );
}
