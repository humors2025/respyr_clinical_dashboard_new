"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PatientList } from "@/components/dashboard/patient-list";
import { SegmentHeatmap } from "@/components/dashboard/segment-heatmap";
import { VolumeChart } from "@/components/dashboard/volume-chart";
import { BandLegend } from "@/components/ui";
import type { DashboardData } from "@/lib/dashboard";
import { shiftApiDate } from "@/lib/scores";

/** `DD/MM/YYYY` (API) ⇄ `YYYY-MM-DD` (native date input). */
function apiToInput(api: string): string {
  const [d, m, y] = api.split("/");
  return y && m && d ? `${y}-${m}-${d}` : "";
}
function inputToApi(value: string): string {
  const [y, m, d] = value.split("-");
  return y && m && d ? `${d}/${m}/${y}` : "";
}
/**
 * `todayApi` is passed in rather than read from the clock, both to keep this
 * pure for rendering and so "Today" means today in the clinic's timezone —
 * which is what the server resolved — not the browser's.
 */
function humanDate(api: string, todayApi: string): string {
  const [d, m, y] = api.split("/").map(Number);
  if (!d || !m || !y) return api;
  const label = new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return api === todayApi ? `Today · ${label}` : label;
}

export function DashboardView({ initialData }: { initialData: DashboardData }) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [date, setDate] = useState(initialData.date);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async (nextDate: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/dashboard?date=${encodeURIComponent(nextDate)}`, {
        cache: "no-store",
      });
      if (res.status === 401) {
        // Session expired mid-visit — bounce to sign-in.
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const payload: DashboardData = await res.json();
      setData(payload);
    } catch {
      setError("Could not refresh the dashboard. Check your connection and try again.");
    }
  }, [router]);

  /*
   * Fetch from the event that changed the date rather than from an effect
   * watching it. The server already rendered the initial day, so an effect
   * would need a "have I mounted yet" flag to avoid refetching it immediately.
   */
  const changeDate = useCallback(
    (next: string) => {
      if (!next || next === date) return;
      setDate(next);
      startTransition(() => {
        void load(next);
      });
    },
    [date, load],
  );

  const hasData = data.patients.length > 0;
  // Derived from the server-rendered date, so no clock is read during render.
  const today = initialData.date;
  const yesterday = shiftApiDate(today, -1);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      {/* ---- page header ---- */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-page-title text-ink">Clinic overview</h1>
          <p className="type-small mt-1 text-ink-3">{humanDate(data.date, today)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-0.5 rounded-input border border-line bg-surface p-0.5">
            <button
              type="button"
              onClick={() => changeDate(today)}
              aria-pressed={date === today}
              className={`type-micro rounded-[6px] px-2.5 py-1.5 transition-colors ${
                date === today ? "bg-card text-ink shadow-[0_1px_2px_rgba(37,37,37,0.08)]" : "text-ink-3 hover:text-ink-2"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => changeDate(yesterday)}
              aria-pressed={date === yesterday}
              className={`type-micro rounded-[6px] px-2.5 py-1.5 transition-colors ${
                date === yesterday ? "bg-card text-ink shadow-[0_1px_2px_rgba(37,37,37,0.08)]" : "text-ink-3 hover:text-ink-2"
              }`}
            >
              Yesterday
            </button>
          </div>

          <label className="relative">
            <span className="sr-only">Test date</span>
            <input
              type="date"
              value={apiToInput(date)}
              max={apiToInput(today)}
              onChange={(e) => {
                changeDate(inputToApi(e.target.value));
              }}
              className="type-small h-9 cursor-pointer rounded-input border border-line bg-card px-3 text-ink-2 outline-none transition-colors focus:border-blue focus:ring-3 focus:ring-blue-light"
            />
          </label>

          <label className="relative">
            <span className="sr-only">Search patients</span>
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-4"
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or subject ID"
              className="type-small h-9 w-full rounded-input border border-line bg-card pl-9 pr-3 text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-blue focus:ring-3 focus:ring-blue-light sm:w-60"
            />
          </label>
        </div>
      </div>

      {/* ---- status strip ---- */}
      {(isPending || error || data.degraded.length > 0) && (
        <div className="flex flex-col gap-2">
          {isPending && (
            <p className="type-small flex items-center gap-2 rounded-input border border-line bg-card px-4 py-2.5 text-ink-3">
              <span className="animate-spin-slow inline-block h-3 w-3 rounded-full border-2 border-line border-t-blue" />
              Loading {humanDate(date, today)}…
            </p>
          )}
          {error && (
            <p role="alert" className="type-small rounded-input border border-red/25 bg-red-light px-4 py-2.5 text-red">
              {error}
            </p>
          )}
          {!error && data.degraded.length > 0 && (
            <p className="type-small rounded-input border border-orange/25 bg-[#fff5eb] px-4 py-2.5 text-orange">
              Some data could not be loaded ({data.degraded.join(", ")}). The figures below may be incomplete.
            </p>
          )}
        </div>
      )}

      <div aria-busy={isPending} className={isPending ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <div className="flex flex-col gap-5">
          <KpiCards data={data} />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-card px-5 py-3">
            <p className="type-label text-ink-2">Score bands</p>
            <BandLegend />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <VolumeChart series={data.testSeries} />
            <SegmentHeatmap segments={data.segments} hasData={hasData} />
          </div>

          <PatientList patients={data.patients} search={search} />
        </div>
      </div>

      <p className="type-micro mx-auto max-w-[80ch] pt-2 text-center font-normal text-ink-4">
        Respyr provides non-invasive screening insights based on breath analysis. Scores indicate
        physiological trends and support preventive monitoring — they do not diagnose, treat, or
        prevent any disease. Clinical judgement and confirmatory testing should precede any medical
        decision.
      </p>
    </div>
  );
}
