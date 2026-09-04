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

/** One test in a subject's history. */
export interface ProfileTest {
  takenAt: string | null; // ISO
  /** `MM/DD/YYYY HH:mm:ss` exactly as upstream sent it — the report keys off this. */
  rawDttm: string;
  scores: Record<ScoreKey, number>;
  acetonePpm: number | null;
  hydrogenPpm: number | null;
  ethanolPpm: number | null;
  fev1: number | null;
}

export interface ProfileSummary {
  id: string;
  name: string;
  gender: Gender;
  age: number | null;
  height: number | null; // cm
  weight: number | null; // kg
  bmi: number | null;
  bmr: number | null; // kcal/day
}

export interface ProfileData {
  subject: ProfileSummary;
  tests: ProfileTest[];
  degraded: string[];
}

/**
 * Mifflin-St Jeor, matching the legacy portal's calculateBMIandBMR exactly.
 * Returns null for an unknown gender rather than guessing, as the original did.
 */
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

function bodyMassIndex(weight: number | null, height: number | null): number | null {
  if (!weight || !height || height <= 0) return null;
  const m = height / 100;
  return Math.round((weight / (m * m)) * 100) / 100;
}

function normalizeTest(row: Record<string, unknown>): ProfileTest {
  const scores = SCORE_KEYS.reduce(
    (acc, key) => {
      acc[key] = toNumber(row[SCORE_META[key].apiField]);
      return acc;
    },
    {} as Record<ScoreKey, number>,
  );
  const taken = parseApiDate(row.dttm);
  const num = (v: unknown) => (v == null || v === "" ? null : toNumber(v));

  return {
    takenAt: taken ? taken.toISOString() : null,
    rawDttm: String(row.dttm ?? ""),
    scores,
    acetonePpm: num(row.acetone_ppm),
    hydrogenPpm: num(row.h2_ppm),
    ethanolPpm: num(row.ethnol_ppm), // upstream really does spell it "ethnol"
    fev1: num(row.FEV1_L),
  };
}

export async function getProfileData(
  loginId: string,
  profileId: string,
  fallbackName: string,
): Promise<ProfileData> {
  const [infoRes, trendsRes] = await Promise.allSettled([
    fetchProfileInfo(loginId, profileId),
    fetchProfileTrends(loginId, profileId),
  ]);

  const degraded: string[] = [];
  const info = infoRes.status === "fulfilled" ? infoRes.value : null;
  if (infoRes.status === "rejected") {
    console.error("[profile] info failed:", infoRes.reason);
    degraded.push("profile");
  }

  let tests: ProfileTest[] = [];
  if (trendsRes.status === "fulfilled") {
    tests = trendsRes.value.map(normalizeTest);
  } else {
    console.error("[profile] trends failed:", trendsRes.reason);
    degraded.push("test history");
  }

  const num = (v: unknown) => (v == null || v === "" ? null : toNumber(v));
  const height = num(info?.height);
  const weight = num(info?.weight);
  const age = num(info?.age);
  const gender = normalizeGender(info?.gender);

  return {
    subject: {
      id: profileId,
      name: String(info?.name ?? fallbackName ?? profileId),
      gender,
      age,
      height,
      weight,
      bmi: bodyMassIndex(weight, height),
      bmr: basalMetabolicRate(weight, height, age, gender),
    },
    // Newest first for the list; the chart re-orders chronologically itself.
    tests: tests.sort((a, b) => (b.takenAt ?? "").localeCompare(a.takenAt ?? "")),
    degraded,
  };
}
