"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MEASUREMENT_BOUNDS, validateMeasurement, type MeasurementField, type Subject } from "@/lib/subjects";

const FIELDS: MeasurementField[] = ["age", "height", "weight"];

export function EditSubjectDialog({
  subject,
  onClose,
  onSaved,
}: {
  subject: Subject;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const initial = {
    age: subject.age?.toString() ?? "",
    height: subject.height?.toString() ?? "",
    weight: subject.weight?.toString() ?? "",
  };

  const [values, setValues] = useState<Record<MeasurementField, string>>(initial);
  const [errors, setErrors] = useState<Partial<Record<MeasurementField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  const dirty = FIELDS.some((f) => values[f] !== initial[f]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving || !dirty) return;

    const nextErrors: Partial<Record<MeasurementField, string>> = {};
    for (const field of FIELDS) {
      const message = validateMeasurement(field, values[field]);
      if (message) nextErrors[field] = message;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/subjects/${encodeURIComponent(subject.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: Number(values.age),
          height: Number(values.height),
          weight: Number(values.weight),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data?.errors) setErrors(data.errors);
        setFormError(data?.error ?? "Could not save the changes.");
        setSaving(false);
        return;
      }
      onSaved(data?.message ?? "Profile updated.");
    } catch {
      setFormError("Cannot reach the server. Check your connection and try again.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(37,37,37,0.35)] p-5 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-subject-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      {/*
        min-w-0 guards the flex-item min-width:auto default, and the height cap
        keeps the dialog usable on short viewports (a phone in landscape).
      */}
      <div className="animate-modal-in max-h-[90vh] w-full min-w-0 max-w-[440px] overflow-y-auto rounded-card border border-line bg-card shadow-[0_20px_60px_rgba(37,37,37,0.18),0_6px_16px_rgba(37,37,37,0.08)]">
        <div className="border-b border-line px-6 py-5">
          <h2 id="edit-subject-title" className="type-section text-ink">
            Edit {subject.name}
          </h2>
          <p className="type-small mt-0.5 text-ink-3">
            {subject.id}
            {subject.gender && ` · ${subject.gender === "M" ? "Male" : "Female"}`}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-4 px-6 py-5">
            <p className="type-small rounded-input border border-line bg-surface px-3.5 py-2.5 text-ink-3">
              Name and gender are set when the subject is created in the Respyr app and cannot be
              changed here.
            </p>

            {FIELDS.map((field) => {
              const bounds = MEASUREMENT_BOUNDS[field];
              const error = errors[field];
              return (
                <div key={field}>
                  <label htmlFor={field} className="type-label mb-1.5 block text-ink-2">
                    {bounds.label} <span className="font-normal text-ink-4">({bounds.unit})</span>
                  </label>
                  <input
                    id={field}
                    ref={field === "age" ? firstFieldRef : undefined}
                    type="number"
                    inputMode="numeric"
                    min={bounds.min}
                    max={bounds.max}
                    step="any"
                    disabled={saving}
                    value={values[field]}
                    onChange={(e) => {
                      setValues((v) => ({ ...v, [field]: e.target.value }));
                      if (errors[field]) setErrors((v) => ({ ...v, [field]: undefined }));
                    }}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${field}-error` : undefined}
                    className="field-input"
                  />
                  {error && (
                    <p id={`${field}-error`} className="type-micro mt-1 font-normal text-red">
                      {error}
                    </p>
                  )}
                </div>
              );
            })}

            {formError && (
              <p role="alert" className="type-small rounded-input border border-red/25 bg-red-light px-3.5 py-2.5 text-red">
                {formError}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-6 py-4">
            <button type="button" onClick={onClose} disabled={saving} className="btn-ghost h-11 px-5">
              Cancel
            </button>
            <button type="submit" disabled={saving || !dirty} className="btn-primary px-6">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
