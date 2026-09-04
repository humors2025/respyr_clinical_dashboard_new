import { normalizeGender, parseApiDate, toNumber, type Gender } from "./scores";

/**
 * A subject profile as registered in the Respyr app.
 *
 * Kept free of `server-only` because the measurement bounds below are shared
 * with the client form — the client copy is a convenience, the server copy in
 * the route handler is the one that actually protects the data.
 */
export interface Subject {
  id: string;
  name: string;
  gender: Gender;
  age: number | null;
  height: number | null; // cm
  weight: number | null; // kg
  createdAt: string | null; // ISO
  bmi: number | null;
}

/**
 * Sanity bounds for the editable measurements.
 *
 * These are deliberately wide — the point is to reject nonsense (a height of
 * 4cm, an age of 900) rather than to second-guess a clinician. It matters
 * because height and weight feed the BMI and BMR shown on the printed report,
 * so a bad value produces confidently wrong clinical output.
 */
export const MEASUREMENT_BOUNDS = {
  age: { min: 1, max: 120, label: "Age", unit: "years" },
  height: { min: 30, max: 250, label: "Height", unit: "cm" },
  weight: { min: 2, max: 400, label: "Weight", unit: "kg" },
} as const;

export type MeasurementField = keyof typeof MEASUREMENT_BOUNDS;

/** Returns an error message, or null when the value is acceptable. */
export function validateMeasurement(field: MeasurementField, value: unknown): string | null {
  const { min, max, label, unit } = MEASUREMENT_BOUNDS[field];
  const n = Number(value);
  if (value === "" || value == null || !Number.isFinite(n)) {
    return `${label} is required.`;
  }
  if (n < min || n > max) {
    return `${label} must be between ${min} and ${max} ${unit}.`;
  }
  return null;
}

function bmi(height: number | null, weight: number | null): number | null {
  if (!height || !weight || height <= 0) return null;
  const m = height / 100;
  return Math.round((weight / (m * m)) * 10) / 10;
}

export function normalizeSubject(row: Record<string, unknown>, index: number): Subject {
  const num = (v: unknown) => (v == null || v === "" ? null : toNumber(v));
  const height = num(row.height);
  const weight = num(row.weight);
  // `dttm` here is an ISO-ish "YYYY-MM-DD HH:mm:ss", unlike the MM/DD/YYYY the
  // score endpoints return, so fall back to Date parsing.
  const created = parseApiDate(row.dttm) ?? (row.dttm ? new Date(String(row.dttm).replace(" ", "T")) : null);

  return {
    id: String(row.subject_id ?? `row-${index}`),
    name: String(row.profile_name ?? "Unknown"),
    gender: normalizeGender(row.gender),
    age: num(row.age),
    height,
    weight,
    createdAt: created && !Number.isNaN(created.getTime()) ? created.toISOString() : null,
    bmi: bmi(height, weight),
  };
}
