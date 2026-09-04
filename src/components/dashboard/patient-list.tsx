"use client";

import { useMemo } from "react";
import { scoreBand, type Patient } from "@/lib/scores";
import { EmptyState, Panel, PanelHeader, ScorePill } from "@/components/ui";

function relativeDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((startOfToday.getTime() - startOfThat.getTime()) / 86_400_000);
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function PatientList({ patients, search }: { patients: Patient[]; search: string }) {
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return patients
      .filter(
        (p) =>
          !query ||
          p.name.toLowerCase().includes(query) ||
          p.id.toLowerCase().includes(query),
      )
      .sort((a, b) => {
        const at = a.takenAt ? Date.parse(a.takenAt) : 0;
        const bt = b.takenAt ? Date.parse(b.takenAt) : 0;
        return bt - at;
      });
  }, [patients, search]);

  const searching = search.trim().length > 0;

  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        title="Test log"
        subtitle={
          searching
            ? `${filtered.length} of ${patients.length} matching "${search.trim()}"`
            : `${filtered.length} test${filtered.length === 1 ? "" : "s"}`
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          title={patients.length === 0 ? "No tests on this date" : "No matching patients"}
          hint={
            patients.length === 0
              ? "Try another date from the picker above."
              : "Check the spelling, or clear the search box."
          }
        />
      ) : (
        <ul className="divide-y divide-line">
          {filtered.map((patient) => (
            <li
              key={`${patient.id}-${patient.takenAt ?? ""}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-surface"
            >
              <div className="min-w-[150px] flex-1">
                <p className="type-body font-medium text-ink">{patient.name}</p>
                <p className="type-micro font-normal text-ink-3">
                  {patient.id}
                  {" · "}
                  {patient.gender === "M" ? "Male" : patient.gender === "F" ? "Female" : "—"}
                  {patient.age != null && ` · ${patient.age} yrs`}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <ScorePill letter="S" value={patient.scores.sugar} band={scoreBand(patient.scores.sugar)} />
                <ScorePill letter="L" value={patient.scores.liver} band={scoreBand(patient.scores.liver)} />
                <ScorePill letter="R" value={patient.scores.respiratory} band={scoreBand(patient.scores.respiratory)} />
                <ScorePill letter="G" value={patient.scores.gut} band={scoreBand(patient.scores.gut)} />
              </div>

              <span className="type-micro w-full text-right font-normal text-ink-4 sm:w-auto sm:min-w-[130px]">
                {relativeDate(patient.takenAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
