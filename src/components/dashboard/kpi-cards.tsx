import type { DashboardData } from "@/lib/dashboard";

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
  const { totals, allowance, demographics } = data;
  const quotaPct =
    allowance && allowance.total > 0
      ? Math.min(100, Math.max(0, (allowance.used / allowance.total) * 100))
      : 0;
  const quotaNearLimit = quotaPct >= 90;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
    </div>
  );
}
