import "server-only";
import { fetchProfileInfo, fetchProfileTrends } from "./respyr-api";
import {
  normalizeGender,
  parseApiDate,
  SCORE_KEYS,
  SCORE_META,
  toNumber,
  type Gender,
  type ScoreKey,
} from "./scores";

/** Spirometry block, parsed out of the `respiratory_fvc_json` string. */
export interface Spirometry {
  measured: { fev1: number | null; fvc: number | null; ratio: number | null; pef: number | null };
  predicted: { fev1: number | null; fvc: number | null; ratio: number | null };
  vsPredicted: { fev1: number | null; fvc: number | null; ratio: number | null };
}

export interface LungFlowPoint {
  t: number; // seconds
  flow: number; // L/s
}

export interface ReportData {
  clinic: { loginId: string };
  subject: {
    id: string;
    name: string;
    gender: Gender;
    age: number | null;
    height: number | null;
    weight: number | null;
    bmi: number | null;
    bmr: number | null;
  };
  test: {
    takenAt: string | null;
    rawDttm: string;
    scores: Record<ScoreKey, number>;
    acetonePpm: number | null;
    hydrogenPpm: number | null;
    ethanolPpm: number | null;
    fev1: number | null;
    spirometry: Spirometry | null;
    lungFlow: LungFlowPoint[];
  } | null;
  /** Recent tests, oldest-first, for the trend charts. */
  trends: { label: string; scores: Record<ScoreKey, number> }[];
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseSpirometry(raw: unknown): Spirometry | null {
  if (!raw) return null;
  let data: Record<string, Record<string, unknown>>;
  try {
    data = typeof raw === "string" ? JSON.parse(raw) : (raw as Record<string, Record<string, unknown>>);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;

  const m = data["Respyr_Measured"] ?? {};
  const p = data["Predicted"] ?? {};
  const c = data["Comparison_with_Predicted(%)"] ?? {};

  return {
    measured: {
      fev1: num(m["FEV1(L)"]),
      fvc: num(m["FVC(L)"]),
      ratio: num(m["FEV1/FVC Ratio(%)"]),
      pef: num(m["PEF(L/min)"]),
    },
    predicted: {
      fev1: num(p["FEV1(L)"]),
      fvc: num(p["FVC(L)"]),
      ratio: num(p["FEV1/FVC_Ratio(%)"]),
    },
    vsPredicted: {
      fev1: num(c["FEV1_vs_Predicted"]),
      fvc: num(c["FVC_vs_Predicted"]),
      ratio: num(c["Ratio_vs_Predicted"]),
    },
  };
}

/**
 * Converts the device's raw chamber-pressure samples into a flow-vs-time curve.
 *
 * Constants and arithmetic are carried over verbatim from calculateLungFlows in
 * the legacy user_report.php — this drives a clinical chart, so it is not a
 * place to "tidy up" the maths.
 */
export function calculateLungFlow(
  raw: unknown,
  { chamberVolume = 39.509211, deltaT = 0.125, calibration = 0.25 } = {},
): LungFlowPoint[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  const all = raw
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isFinite(v));
  if (all.length < 2) return [];

  const base = all[0];
  const rest = all.slice(1);
  return rest.map((pressure, i) => {
    const rawFlow = pressure === 0 ? 0 : (chamberVolume * (1 - base / pressure)) / deltaT;
    return { t: Number(((i + 1) * deltaT).toFixed(3)), flow: rawFlow * calibration };
  });
}

function bodyMassIndex(weight: number | null, height: number | null): number | null {
  if (!weight || !height || height <= 0) return null;
  const m = height / 100;
  return Math.round((weight / (m * m)) * 100) / 100;
}

function basalMetabolicRate(
  weight: number | null,
  height: number | null,
  age: number | null,
  gender: Gender,
): number | null {
  if (!weight || !height || !age || !gender) return null;
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round((gender === "M" ? base + 5 : base - 161) * 100) / 100;
}

function readScores(row: Record<string, unknown>): Record<ScoreKey, number> {
  return SCORE_KEYS.reduce(
    (acc, key) => {
      acc[key] = toNumber(row[SCORE_META[key].apiField]);
      return acc;
    },
    {} as Record<ScoreKey, number>,
  );
}

/**
 * Assembles one printed report.
 *
 * The legacy portal passed all of this through the URL — roughly 18 query
 * parameters including whole JSON blobs, which put patient scores and biomarker
 * readings into browser history, access logs and referrer headers. Here only the
 * subject id and the test timestamp travel; everything else is fetched
 * server-side against the session's clinic.
 */
export async function getReportData(
  loginId: string,
  profileId: string,
  testDttm: string,
): Promise<ReportData> {
  const [infoRes, trendsRes] = await Promise.allSettled([
    fetchProfileInfo(loginId, profileId),
    fetchProfileTrends(loginId, profileId),
  ]);

  const info = infoRes.status === "fulfilled" ? infoRes.value : null;
  const rows = trendsRes.status === "fulfilled" ? trendsRes.value : [];

  const height = num(info?.height);
  const weight = num(info?.weight);
  const age = num(info?.age);
  const gender = normalizeGender(info?.gender);

  // Match on the exact upstream timestamp; fall back to the newest test so a
  // stale link degrades to something sensible rather than an error page.
  const match =
    rows.find((r) => String(r.dttm ?? "") === testDttm) ??
    [...rows].sort((a, b) => String(b.dttm ?? "").localeCompare(String(a.dttm ?? "")))[0];

  const test = match
    ? (() => {
        const taken = parseApiDate(match.dttm);
        return {
          takenAt: taken ? taken.toISOString() : null,
          rawDttm: String(match.dttm ?? ""),
          scores: readScores(match),
          acetonePpm: num(match.acetone_ppm),
          hydrogenPpm: num(match.h2_ppm),
          ethanolPpm: num(match.ethnol_ppm),
          fev1: num(match.FEV1_L),
          spirometry: parseSpirometry(match.respiratory_fvc_json),
          lungFlow: calculateLungFlow(match.blow_raw_values),
        };
      })()
    : null;

  const trends = [...rows]
    .sort((a, b) => {
      const da = parseApiDate(a.dttm)?.getTime() ?? 0;
      const db = parseApiDate(b.dttm)?.getTime() ?? 0;
      return da - db;
    })
    .slice(-7)
    .map((r) => {
      const d = parseApiDate(r.dttm);
      return {
        label: d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—",
        scores: readScores(r),
      };
    });

  return {
    clinic: { loginId },
    subject: {
      id: profileId,
      name: String(info?.name ?? profileId),
      gender,
      age,
      height,
      weight,
      bmi: bodyMassIndex(weight, height),
      bmr: basalMetabolicRate(weight, height, age, gender),
    },
    test,
    trends,
  };
}
