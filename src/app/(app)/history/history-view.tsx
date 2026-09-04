"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { HistoryData, SubjectRecord } from "@/lib/history";
import { BAND_META, SCORE_KEYS, SCORE_META, scoreBand, type ScoreKey } from "@/lib/scores";
import { BandLegend, EmptyState, Panel, PanelHeader } from "@/components/ui";

type SortKey = "name" | "tests" | "lastTested" | ScoreKey;
type Direction = "asc" | "desc";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function compare(a: SubjectRecord, b: SubjectRecord, key: SortKey): number {
  switch (key) {
    case "name":
      return a.name.localeCompare(b.name);
    case "tests":
      return a.testsTaken - b.testsTaken;
    case "lastTested":
      return (
        (a.lastTestedAt ? Date.parse(a.lastTestedAt) : 0) -
        (b.lastTestedAt ? Date.parse(b.lastTestedAt) : 0)
      );
    default:
      return a.scores[key] - b.scores[key];
  }
}

export function HistoryView({ data }: { data: HistoryData }) {
  const [search, setSearch] = useState("");
  // Most recently tested first is the useful default for clinic staff.
  const [sort, setSort] = useState<{ key: SortKey; dir: Direction }>({
    key: "lastTested",
    dir: "desc",
  });

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = data.subjects.filter(
      (s) => !query || s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query),
    );
    const sorted = [...filtered].sort((a, b) => compare(a, b, sort.key));
    return sort.dir === "desc" ? sorted.reverse() : sorted;
  }, [data.subjects, search, sort]);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : // Scores and counts are most useful worst/highest-first on first click.
          { key, dir: key === "name" ? "asc" : "desc" },
    );
  }

  const searching = search.trim().length > 0;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-page-title text-ink">Test history</h1>
          <p className="type-small mt-1 text-ink-3">
            Every subject with their latest scores and total tests taken.
          </p>
        </div>

        <label className="relative">
          <span className="sr-only">Search subjects</span>
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
            className="type-small h-9 w-full rounded-input border border-line bg-card pl-9 pr-3 text-ink outline-none transition-colors placeholder:text-ink-4 focus:border-blue focus:ring-3 focus:ring-blue-light sm:w-72"
          />
        </label>
      </div>

      {data.error && (
        <p role="alert" className="type-small rounded-input border border-red/25 bg-red-light px-4 py-2.5 text-red">
          {data.error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="panel p-5">
          <span className="type-label text-ink-3">Subjects</span>
          <p className="mt-2 text-[30px] font-semibold tracking-[-0.6px] text-ink tabular-nums">
            {data.totals.subjects.toLocaleString()}
          </p>
        </div>
        <div className="panel p-5">
          <span className="type-label text-ink-3">Tests taken</span>
          <p className="mt-2 text-[30px] font-semibold tracking-[-0.6px] text-ink tabular-nums">
            {data.totals.tests.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-card px-5 py-3">
        <p className="type-label text-ink-2">Score bands</p>
        <BandLegend />
      </div>

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Subjects"
          subtitle={
            searching
              ? `${rows.length} of ${data.totals.subjects} matching "${search.trim()}"`
              : `${rows.length} subject${rows.length === 1 ? "" : "s"}`
          }
        />

        {rows.length === 0 ? (
          <EmptyState
            title={data.subjects.length === 0 ? "No subjects yet" : "No matching subjects"}
            hint={
              data.subjects.length === 0
                ? "Subjects appear here once they are created in the Respyr app and have taken a test."
                : "Check the spelling, or clear the search box."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <SortHeader label="Subject" sortKey="name" sort={sort} onSort={toggleSort} align="left" />
                  <SortHeader label="Tests" sortKey="tests" sort={sort} onSort={toggleSort} />
                  {SCORE_KEYS.map((key) => (
                    <SortHeader
                      key={key}
                      label={SCORE_META[key].label}
                      sortKey={key}
                      sort={sort}
                      onSort={toggleSort}
                    />
                  ))}
                  <SortHeader label="Last tested" sortKey="lastTested" sort={sort} onSort={toggleSort} />
                </tr>
              </thead>
              <tbody>
                {rows.map((subject) => (
                  <tr
                    key={subject.id}
                    className="border-b border-line transition-colors last:border-0 hover:bg-surface"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/subjects/${encodeURIComponent(subject.id)}?name=${encodeURIComponent(subject.name)}`}
                        className="group block"
                      >
                        <p className="type-body font-medium text-ink transition-colors group-hover:text-blue">
                          {subject.name}
                        </p>
                        <p className="type-micro font-normal text-ink-3">
                          {subject.id}
                          {subject.gender && ` · ${subject.gender === "M" ? "Male" : "Female"}`}
                        </p>
                      </Link>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className="type-body text-ink-2 tabular-nums">{subject.testsTaken}</span>
                    </td>
                    {SCORE_KEYS.map((key) => {
                      const value = subject.scores[key];
                      const band = scoreBand(value);
                      return (
                        <td key={key} className="px-3 py-3.5 text-center">
                          {value > 0 ? (
                            <span
                              className="type-label inline-flex min-w-[52px] items-center justify-center gap-1.5 rounded-badge px-2 py-1 tabular-nums"
                              style={{ background: BAND_META[band].tint, color: BAND_META[band].color }}
                              title={BAND_META[band].label}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: BAND_META[band].color }}
                              />
                              {Math.round(value)}%
                            </span>
                          ) : (
                            <span className="type-small text-ink-4">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="type-small px-5 py-3.5 text-right whitespace-nowrap text-ink-3">
                      {formatDate(subject.lastTestedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  align = "center",
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: Direction };
  onSort: (key: SortKey) => void;
  align?: "left" | "center";
}) {
  const active = sort.key === sortKey;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      className={`px-3 py-3 first:pl-5 last:pr-5 ${align === "left" ? "text-left" : "text-center"}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`type-label inline-flex items-center gap-1 transition-colors hover:text-blue ${
          active ? "text-blue" : "text-ink-3"
        }`}
      >
        {label}
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          className={active ? "" : "opacity-30"}
          aria-hidden
        >
          {active && sort.dir === "asc" ? <path d="m6 15 6-6 6 6" /> : <path d="m6 9 6 6 6-6" />}
        </svg>
      </button>
    </th>
  );
}
