import type { ReportData } from "@/lib/report";
import {
  CLINICAL_INSIGHT,
  CORRELATION,
  QUICK_SUMMARY,
  REPORT_DISCLAIMER,
  SCORE_COPY,
} from "@/lib/report-text";
import { BAND_META, SCORE_KEYS, SCORE_META, scoreBand, type ScoreKey } from "@/lib/scores";
import { BrandMark } from "@/components/brand-mark";
import { LungFlowChart } from "@/components/profile/lung-flow-chart";
import { MiniTrendChart } from "@/components/profile/mini-trend-chart";

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

/** One A4 sheet. `.report-page` is the selector html2canvas rasterises. */
function Page({ children }: { children: React.ReactNode }) {
  return (
    <section className="report-page mx-auto w-full max-w-[820px] break-after-page bg-white shadow-[0_2px_14px_rgba(37,37,37,0.09)] print:shadow-none">
      <header className="flex items-center justify-between bg-blue px-8 py-4">
        <div className="flex items-center gap-2.5">
          <BrandMark size={26} />
          <span className="text-[15px] font-semibold tracking-[-0.3px] text-white">respyr</span>
        </div>
        <span className="text-[14px] font-medium tracking-[-0.28px] text-white">Health Report</span>
      </header>
      <div className="px-8 py-7">{children}</div>
    </section>
  );
}

function SubjectStrip({ data }: { data: ReportData }) {
  const { subject, test } = data;
  const items: [string, string][] = [
    ["Name", subject.name],
    ["Gender", subject.gender === "M" ? "Male" : subject.gender === "F" ? "Female" : "—"],
    ["Height", subject.height != null ? `${subject.height} cm` : "—"],
    ["Weight", subject.weight != null ? `${subject.weight} kg` : "—"],
    ["BMI", subject.bmi != null ? String(subject.bmi) : "—"],
    ["BMR", subject.bmr != null ? `${subject.bmr} kcal/day` : "—"],
    ["Subject ID", subject.id],
    ["Tested", formatDateTime(test?.takenAt ?? null)],
  ];
  return (
    <div className="grid grid-cols-4 gap-x-4 gap-y-3 rounded-input border border-line bg-surface px-5 py-4">
      {items.map(([label, value]) => (
        <div key={label}>
          <p className="text-[10px] font-medium tracking-[-0.2px] text-ink-3">{label}</p>
          <p className="text-[12px] font-semibold tracking-[-0.24px] text-ink">{value}</p>
        </div>
      ))}
    </div>
  );
}

function ScoreDetailPage({ data, scoreKey }: { data: ReportData; scoreKey: ScoreKey }) {
  const value = data.test?.scores[scoreKey] ?? 0;
  const band = scoreBand(value);
  const copy = SCORE_COPY[scoreKey][band];
  const meta = SCORE_META[scoreKey];

  const biomarker =
    scoreKey === "sugar"
      ? data.test?.acetonePpm
      : scoreKey === "gut"
        ? data.test?.hydrogenPpm
        : scoreKey === "liver"
          ? data.test?.ethanolPpm
          : data.test?.fev1;

  return (
    <>
      <SubjectStrip data={data} />

      <div className="mt-6 flex items-start justify-between gap-6">
        <div>
          <h2 className="text-[19px] font-semibold tracking-[-0.38px] text-ink">
            {meta.label} Score
          </h2>
          <p className="mt-1 text-[12px] tracking-[-0.24px] text-ink-3">{CLINICAL_INSIGHT[scoreKey]}</p>
        </div>
        <div
          className="shrink-0 rounded-card px-6 py-4 text-center"
          style={{ background: BAND_META[band].tint }}
        >
          <p className="text-[30px] font-semibold tracking-[-0.6px]" style={{ color: BAND_META[band].color }}>
            {value > 0 ? `${value}%` : "—"}
          </p>
          <p className="text-[12px] font-semibold tracking-[-0.24px]" style={{ color: BAND_META[band].color }}>
            {BAND_META[band].label}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <Block title="Finding">{copy.finding}</Block>
        <Block title="Respyr Score Meaning">{copy.meaning}</Block>
        <Block title="Clinical Considerations / Suggested Next Steps">{copy.nextSteps}</Block>
        {biomarker != null && (
          <Block title={`Measured ${meta.biomarker}`}>
            {biomarker} {meta.unit}
          </Block>
        )}
        <Block title="Correlation">{CORRELATION[scoreKey]}</Block>
      </div>

      {data.trends.length > 1 && (
        <div className="mt-6">
          <p className="mb-2 text-[11px] font-medium tracking-[-0.22px] text-ink-2">
            Recent {meta.label.toLowerCase()} trend
          </p>
          <MiniTrendChart
            points={data.trends.map((t) => ({ label: t.label, value: t.scores[scoreKey] }))}
          />
        </div>
      )}
    </>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-input border border-line px-4 py-3">
      <p className="text-[10px] font-semibold tracking-[-0.2px] text-blue uppercase">{title}</p>
      <p className="mt-1 text-[12px] leading-[1.65] tracking-[-0.24px] text-ink-2">{children}</p>
    </div>
  );
}

export function ReportDocument({ data }: { data: ReportData }) {
  const { subject, test } = data;

  return (
    <div className="flex flex-col gap-6 print:gap-0">
      {/* ---- 1. Cover ---- */}
      <Page>
        <div className="rounded-card bg-blue-light px-7 py-8">
          <h1 className="text-[27px] leading-[1.2] font-semibold tracking-[-0.54px] text-blue">
            India&rsquo;s first breath-based
            <br />
            health screening device
          </h1>
          <div className="mt-5 inline-flex items-center gap-3 rounded-input bg-white px-4 py-2.5">
            <span className="text-[11px] font-medium tracking-[-0.22px] text-ink-2">
              CDSCO Approved Class-B IVD Device
            </span>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-[12px] tracking-[-0.24px] text-ink-3">Subject ID : {subject.id}</p>
          <p className="text-[12px] tracking-[-0.24px] text-ink-3">
            Date &amp; Time : {formatDateTime(test?.takenAt ?? null)}
          </p>
          <h2 className="mt-4 text-[24px] font-semibold tracking-[-0.48px] text-ink">{subject.name}</h2>
          <p className="text-[13px] tracking-[-0.26px] text-ink-3">
            {subject.gender === "M" ? "Male" : subject.gender === "F" ? "Female" : "—"}
            {subject.age != null && `, ${subject.age} yrs`}
          </p>

          <div className="mt-10">
            <h3 className="text-[30px] leading-[1.15] font-semibold tracking-[-0.6px] text-ink">
              A Comprehensive
              <br />
              Health Report
            </h3>
            <p className="mt-2 text-[13px] tracking-[-0.26px] text-ink-3">
              Breath-based health insights personalised for you
            </p>
          </div>
        </div>
      </Page>

      {/* ---- 2. Personalised summary ---- */}
      <Page>
        <h2 className="text-[19px] font-semibold tracking-[-0.38px] text-ink">
          Personalised Health Summary
        </h2>
        <p className="mt-1 text-[12px] tracking-[-0.24px] text-ink-3">
          {subject.name} · {subject.id} · {formatDateTime(test?.takenAt ?? null)}
        </p>

        <p className="mt-5 text-[12px] leading-[1.7] tracking-[-0.24px] text-ink-2">
          {subject.name}, congratulations! We&rsquo;ve successfully completed your health screening
          using the Respyr device. This is a meaningful step toward staying in control of your health
          and uncovering opportunities for improvement.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          {(Object.keys(BAND_META) as (keyof typeof BAND_META)[]).map((band) => (
            <span key={band} className="flex items-center gap-2 text-[11px] tracking-[-0.22px] text-ink-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: BAND_META[band].color }} />
              <b className="font-semibold">{BAND_META[band].label}</b>
              {BAND_META[band].range}
            </span>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {SCORE_KEYS.map((key) => {
            const v = test?.scores[key] ?? 0;
            const band = scoreBand(v);
            return (
              <div key={key} className="rounded-card border border-line px-5 py-4">
                <p className="text-[12px] font-medium tracking-[-0.24px] text-ink-2">
                  {SCORE_META[key].label} Score
                </p>
                <p
                  className="mt-1 text-[28px] font-semibold tracking-[-0.56px]"
                  style={{ color: v > 0 ? BAND_META[band].color : "var(--color-ink-4)" }}
                >
                  {v > 0 ? `${v}%` : "—"}
                </p>
                <p className="text-[11px] font-semibold tracking-[-0.22px]" style={{ color: BAND_META[band].color }}>
                  {v > 0 ? BAND_META[band].label : ""}
                </p>
              </div>
            );
          })}
        </div>
      </Page>

      {/* ---- 3. Quick summary ---- */}
      <Page>
        <h2 className="text-[19px] font-semibold tracking-[-0.38px] text-ink">Quick Summary</h2>
        <p className="mt-1 text-[12px] tracking-[-0.24px] text-ink-3">
          A simple breakdown of each health score generated by the Respyr device.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          {SCORE_KEYS.map((key) => {
            const v = test?.scores[key] ?? 0;
            const band = scoreBand(v);
            return (
              <div
                key={key}
                className="flex items-start gap-4 rounded-input border border-line px-4 py-3.5"
              >
                <div
                  className="shrink-0 rounded-badge px-3 py-1.5 text-center"
                  style={{ background: BAND_META[band].tint }}
                >
                  <p className="text-[15px] font-semibold tracking-[-0.3px]" style={{ color: BAND_META[band].color }}>
                    {v > 0 ? `${Math.round(v)}%` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold tracking-[-0.24px] text-ink">
                    {SCORE_META[key].label} Score
                  </p>
                  <p className="mt-0.5 text-[12px] leading-[1.6] tracking-[-0.24px] text-ink-2">
                    {QUICK_SUMMARY[key][band]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-[10px] leading-[1.6] tracking-[-0.2px] text-ink-4">{REPORT_DISCLAIMER}</p>
      </Page>

      {/* ---- 4–7. One page per score ---- */}
      {SCORE_KEYS.map((key) => (
        <Page key={key}>
          <ScoreDetailPage data={data} scoreKey={key} />
        </Page>
      ))}

      {/* ---- 8. Spirometry detail ---- */}
      <Page>
        <SubjectStrip data={data} />
        <h2 className="mt-6 text-[19px] font-semibold tracking-[-0.38px] text-ink">
          Respiratory detail
        </h2>

        {test?.spirometry ? (
          <table className="mt-4 w-full border-collapse text-[12px] tracking-[-0.24px]">
            <thead>
              <tr className="border-b border-line">
                {["Parameter", "Measured", "Predicted", "% of predicted"].map((h, i) => (
                  <th
                    key={h}
                    className={`py-2 font-semibold text-ink-3 ${i === 0 ? "text-left" : "text-right"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["FEV1 (L)", test.spirometry.measured.fev1, test.spirometry.predicted.fev1, test.spirometry.vsPredicted.fev1],
                  ["FVC (L)", test.spirometry.measured.fvc, test.spirometry.predicted.fvc, test.spirometry.vsPredicted.fvc],
                  ["FEV1/FVC (%)", test.spirometry.measured.ratio, test.spirometry.predicted.ratio, test.spirometry.vsPredicted.ratio],
                  ["PEF (L/min)", test.spirometry.measured.pef, null, null],
                ] as const
              ).map(([label, m, p, pct]) => (
                <tr key={label} className="border-b border-line last:border-0">
                  <td className="py-2.5 text-ink-2">{label}</td>
                  <td className="py-2.5 text-right font-semibold text-ink">{m ?? "—"}</td>
                  <td className="py-2.5 text-right text-ink-2">{p ?? "—"}</td>
                  <td className="py-2.5 text-right text-ink-2">{pct != null ? `${pct}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-4 text-[12px] text-ink-3">
            No spirometry detail was recorded for this test.
          </p>
        )}

        {test && test.lungFlow.length > 1 && (
          <div className="mt-7">
            <p className="mb-2 text-[11px] font-medium tracking-[-0.22px] text-ink-2">
              Expiratory flow curve
            </p>
            <LungFlowChart points={test.lungFlow} />
          </div>
        )}

        <p className="mt-7 text-[10px] leading-[1.6] tracking-[-0.2px] text-ink-4">{REPORT_DISCLAIMER}</p>
      </Page>
    </div>
  );
}
