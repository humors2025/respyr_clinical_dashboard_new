import "server-only";
import { fetchSubjectRoster } from "./respyr-api";
import {
  normalizeGender,
  parseApiDate,
  SCORE_KEYS,
  SCORE_META,
  toNumber,
  type Gender,
  type ScoreKey,
} from "./scores";

/**
 * A subject's standing record: their most recent scores plus how many tests
 * they have taken in total.
 *
 * Note this is a roster, not a chronological log — the upstream returns one
 * row per subject, not one per test. The legacy portal labelled the same view
 * "Test history", so the name is kept for continuity with clinic staff.
 */
export interface SubjectRecord {
  id: string;
  name: string;
  gender: Gender;
  testsTaken: number;
  lastTestedAt: string | null; // ISO
  scores: Record<ScoreKey, number>;
  overall: number;
}

export interface HistoryData {
  subjects: SubjectRecord[];
  totals: {
    subjects: number;
    tests: number;
  };
  /** Set when the upstream call failed, so the UI can say so. */
  error: string | null;
}

function normalizeSubject(row: Record<string, unknown>, index: number): SubjectRecord {
  const scores = SCORE_KEYS.reduce(
    (acc, key) => {
      acc[key] = toNumber(row[SCORE_META[key].apiField]);
      return acc;
    },
    {} as Record<ScoreKey, number>,
  );

  const present = SCORE_KEYS.map((k) => scores[k]).filter((v) => v > 0);
  const lastTested = parseApiDate(row.dttm);

  return {
    id: String(row.profile_id ?? `row-${index}`),
    name: String(row.name ?? "Unknown"),
    gender: normalizeGender(row.gender),
    testsTaken: toNumber(row.count_taken),
    lastTestedAt: lastTested ? lastTested.toISOString() : null,
    scores,
    overall: present.length ? present.reduce((a, b) => a + b, 0) / present.length : 0,
  };
}

export async function getHistoryData(loginId: string): Promise<HistoryData> {
  try {
    const rows = await fetchSubjectRoster(loginId);
    const subjects = rows.map(normalizeSubject);
    return {
      subjects,
      totals: {
        subjects: subjects.length,
        tests: subjects.reduce((sum, s) => sum + s.testsTaken, 0),
      },
      error: null,
    };
  } catch (err) {
    console.error("[history] subject roster failed:", err);
    return {
      subjects: [],
      totals: { subjects: 0, tests: 0 },
      error: "Could not load the subject roster. Please try again shortly.",
    };
  }
}
