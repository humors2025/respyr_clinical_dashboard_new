/**
 * Respyr score domain model.
 *
 * The device reports four breath-derived scores. The API returns them under the
 * legacy column names below; everything above this module works with the
 * friendly keys instead.
 */

export type ScoreKey = "sugar" | "liver" | "respiratory" | "gut";
export type Band = "good" | "fair" | "poor";

export const SCORE_META: Record<
  ScoreKey,
  { label: string; apiField: string; biomarker: string; ppmField: string | null; unit: string }
> = {
  sugar: {
    label: "Sugar",
    apiField: "Db_Score",
    biomarker: "Acetone",
    ppmField: "acetone_ppm",
    unit: "ppm",
  },
  liver: {
    label: "Liver",
    apiField: "liver_score",
    biomarker: "Ethanol",
    ppmField: "ethnol_ppm", // NB: the API really does spell it "ethnol"
    unit: "ppm",
  },
  respiratory: {
    label: "Respiratory",
    apiField: "Blow_Score",
    biomarker: "FEV1",
    ppmField: null,
    unit: "L",
  },
  gut: {
    label: "Gut",
    apiField: "Gut_Score_per",
    biomarker: "Hydrogen",
    ppmField: "h2_ppm",
    unit: "ppm",
  },
};

export const SCORE_KEYS = Object.keys(SCORE_META) as ScoreKey[];

/**
 * Band thresholds. These mirror the PHP report generator (report/methods.php)
 * exactly — do not drift from them, clinicians read the wording against them.
 */
export const BAND_THRESHOLDS = { good: 80, fair: 70 } as const;

export function scoreBand(value: number | null | undefined): Band {
  const n = Number(value);
  if (!Number.isFinite(n)) return "poor";
  if (n >= BAND_THRESHOLDS.good) return "good";
  if (n >= BAND_THRESHOLDS.fair) return "fair";
  return "poor";
}

export const BAND_META: Record<Band, { label: string; range: string; color: string; tint: string }> = {
  good: { label: "Good", range: "80–100%", color: "var(--color-green)", tint: "var(--color-green-light)" },
  fair: { label: "Fair", range: "70–79%", color: "var(--color-amber)", tint: "var(--color-amber-light)" },
  poor: { label: "Poor", range: "0–69%", color: "var(--color-red)", tint: "var(--color-red-light)" },
};

/** Age buckets used by the demographics heatmap. */
export const AGE_BUCKETS = [
  { label: "18–24", min: 18, max: 24 },
  { label: "25–32", min: 25, max: 32 },
  { label: "33–40", min: 33, max: 40 },
  { label: "41–50", min: 41, max: 50 },
  { label: "50+", min: 51, max: 200 },
] as const;

export function ageBucketIndex(age: number | null): number {
  if (age == null || !Number.isFinite(age)) return -1;
  return AGE_BUCKETS.findIndex((b) => age >= b.min && age <= b.max);
}

export type Gender = "M" | "F" | null;

export function normalizeGender(value: unknown): Gender {
  const g = String(value ?? "").trim().toLowerCase();
  if (g.startsWith("m")) return "M";
  if (g.startsWith("f")) return "F";
  return null;
}

/**
 * The API sends timestamps as `MM/DD/YYYY HH:mm:ss`. `new Date(string)` parses
 * that inconsistently across engines, so pull it apart explicitly.
 */
export function parseApiDate(dttm: unknown): Date | null {
  if (!dttm) return null;
  const [datePart, timePart = "00:00:00"] = String(dttm).trim().split(" ");
  const bits = datePart.split("/");
  if (bits.length !== 3) return null;
  const [month, day, year] = bits.map(Number);
  const [h = 0, m = 0, s = 0] = timePart.split(":").map(Number);
  if (!month || !day || !year) return null;
  const d = new Date(year, month - 1, day, h, m, s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** `DD/MM/YYYY` — the format the analytics endpoint expects for its `date` param. */
export function toApiDateParam(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/**
 * Clinics are in India and the legacy PHP pinned every date to Asia/Kolkata
 * (`date_default_timezone_set`). Amplify's servers run in UTC, so deriving
 * "today" from the server clock would show yesterday's results to anyone
 * loading the dashboard between midnight and 05:30 IST.
 */
export const CLINIC_TIMEZONE = "Asia/Kolkata";

/** Today's date in the clinic's timezone, as `DD/MM/YYYY`. */
export function todayInClinicTz(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")}`;
}

/**
 * Shifts a `DD/MM/YYYY` string by whole days. Pure — takes no clock reading —
 * so it is safe to call during a React render.
 */
export function shiftApiDate(api: string, deltaDays: number): string {
  const [d, m, y] = api.split("/").map(Number);
  if (!d || !m || !y) return api;
  const shifted = new Date(Date.UTC(y, m - 1, d));
  shifted.setUTCDate(shifted.getUTCDate() + deltaDays);
  return `${String(shifted.getUTCDate()).padStart(2, "0")}/${String(
    shifted.getUTCMonth() + 1,
  ).padStart(2, "0")}/${shifted.getUTCFullYear()}`;
}

export function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** A single test result, normalised out of the raw API row. */
export interface Patient {
  id: string;
  name: string;
  gender: Gender;
  age: number | null;
  takenAt: string | null; // ISO, or null when unparseable
  scores: Record<ScoreKey, number>;
  overall: number;
  biomarkers: {
    acetone: number | null;
    ethanol: number | null;
    hydrogen: number | null;
  };
}

export function normalizePatient(row: Record<string, unknown>, index: number): Patient {
  const scores = SCORE_KEYS.reduce(
    (acc, key) => {
      acc[key] = toNumber(row[SCORE_META[key].apiField]);
      return acc;
    },
    {} as Record<ScoreKey, number>,
  );

  const present = SCORE_KEYS.map((k) => scores[k]).filter((v) => v > 0);
  const overall = present.length ? present.reduce((a, b) => a + b, 0) / present.length : 0;
  const takenAt = parseApiDate(row.dttm);

  const num = (v: unknown) => (v == null || v === "" ? null : toNumber(v));

  return {
    id: String(row.profile_id ?? row.id ?? `row-${index}`),
    name: String(row.name ?? "Unknown"),
    gender: normalizeGender(row.gender),
    age: row.age == null || row.age === "" ? null : toNumber(row.age),
    takenAt: takenAt ? takenAt.toISOString() : null,
    scores,
    overall,
    biomarkers: {
      acetone: num(row.acetone_ppm),
      ethanol: num(row.ethnol_ppm),
      hydrogen: num(row.h2_ppm),
    },
  };
}
