"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Subject } from "@/lib/subjects";
import { EmptyState, Panel, PanelHeader } from "@/components/ui";
import { EditSubjectDialog } from "./edit-subject-dialog";

function formatCreated(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function SubjectsView({ subjects, error }: { subjects: Subject[]; error: string | null }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Subject | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return subjects
      .filter((s) => !query || s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query))
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  }, [subjects, search]);

  const searching = search.trim().length > 0;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-page-title text-ink">Subjects</h1>
          <p className="type-small mt-1 text-ink-3">
            Profiles registered to this clinic. Subjects are created in the Respyr app.
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

      {error && (
        <p role="alert" className="type-small rounded-input border border-red/25 bg-red-light px-4 py-2.5 text-red">
          {error}
        </p>
      )}

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Registered subjects"
          subtitle={
            searching
              ? `${rows.length} of ${subjects.length} matching "${search.trim()}"`
              : `${rows.length} subject${rows.length === 1 ? "" : "s"}`
          }
        />

        {rows.length === 0 ? (
          <EmptyState
            title={subjects.length === 0 ? "No subjects found" : "No matching subjects"}
            hint={
              subjects.length === 0
                ? "Create subjects in the Respyr app and they will appear here."
                : "Check the spelling, or clear the search box."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-line">
                  {["Subject", "Age", "Height", "Weight", "BMI", "Created", ""].map((h, i) => (
                    <th
                      key={h || `actions-${i}`}
                      scope="col"
                      className={`type-label px-3 py-3 text-ink-3 first:pl-5 last:pr-5 ${
                        i === 0 ? "text-left" : i === 6 ? "text-right" : "text-center"
                      }`}
                    >
                      {h || <span className="sr-only">Actions</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((subject) => (
                  <tr
                    key={subject.id}
                    className="border-b border-line transition-colors last:border-0 hover:bg-surface"
                  >
                    <td className="px-5 py-3.5">
                      <p className="type-body font-medium text-ink">{subject.name}</p>
                      <p className="type-micro font-normal text-ink-3">
                        {subject.id}
                        {subject.gender && ` · ${subject.gender === "M" ? "Male" : "Female"}`}
                      </p>
                    </td>
                    <td className="type-body px-3 py-3.5 text-center text-ink-2 tabular-nums">
                      {subject.age ?? "—"}
                    </td>
                    <td className="type-body px-3 py-3.5 text-center text-ink-2 tabular-nums">
                      {subject.height != null ? `${subject.height} cm` : "—"}
                    </td>
                    <td className="type-body px-3 py-3.5 text-center text-ink-2 tabular-nums">
                      {subject.weight != null ? `${subject.weight} kg` : "—"}
                    </td>
                    <td className="type-body px-3 py-3.5 text-center text-ink-2 tabular-nums">
                      {subject.bmi ?? "—"}
                    </td>
                    <td className="type-small px-3 py-3.5 text-center whitespace-nowrap text-ink-3">
                      {formatCreated(subject.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setEditing(subject)}
                        className="btn-ghost h-8"
                        aria-label={`Edit ${subject.name}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {editing && (
        <EditSubjectDialog
          subject={editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setToast(message);
            // Re-render the server component so the table shows the saved values.
            router.refresh();
          }}
        />
      )}

      {toast && (
        <div
          role="status"
          className="animate-modal-in fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-input border border-green/25 bg-green-light px-4 py-3 shadow-[0_12px_32px_rgba(37,37,37,0.14)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
          <span className="type-small text-green">{toast}</span>
        </div>
      )}
    </div>
  );
}
