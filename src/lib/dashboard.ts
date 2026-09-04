import "server-only";
import {
  fetchAllowance,
  fetchAnalytics,
  fetchClinicLogo,
  fetchOnboardedCount,
  fetchWeeklyReports,
  type Allowance,
} from "./respyr-api";
import {
  AGE_BUCKETS,
  ageBucketIndex,
  normalizePatient,
  SCORE_KEYS,
  scoreBand,
  type Band,
  type Patient,
  type ScoreKey,
} from "./scores";

export interface MetricSummary {
  key: ScoreKey;
  label: string;
  average: number;
  counts: Record<Band, number>;
}

export interface SegmentCell {
  gender: "M" | "F";
  bucket: number;
  count: number;
  averages: Record<ScoreKey | "overall", number>;
}

export interface DashboardData {
  date: string;
  clinic: { loginId: string; username: string; logo: string | null };
  totals: {
    onboarded: number;
    testsOnDate: number;
    averageScore: number;
  };
  allowance: Allowance | null;
  demographics: { male: number; female: number; malePct: number; femalePct: number };
  metrics: MetricSummary[];
  segments: SegmentCell[];
  testSeries: { day: string; count: number }[];
  patients: Patient[];
  /** Endpoints that failed, so the UI can say so instead of rendering zeros. */
  degraded: string[];
}

function average(values: number[]): number {
  const usable = values.filter((v) => Number.isFinite(v) && v > 0);
  if (!usable.length) return 0;
  return usable.reduce((a, b) => a + b, 0) / usable.length;
}

/**
 * Assembles everything the dashboard needs in one server-side pass.
 *
 * Each upstream call is settled independently: one dead endpoint degrades a
 * single card rather than blanking the whole page.
 */
export async function getDashboardData(
  loginId: string,
  username: string,
  date: string,
): Promise<DashboardData> {
  const [analyticsRes, onboardedRes, allowanceRes, reportsRes, logoRes] = await Promise.allSettled([
    fetchAnalytics(loginId, date),
    fetchOnboardedCount(loginId),
    fetchAllowance(loginId),
    fetchWeeklyReports(loginId),
    fetchClinicLogo(loginId),
  ]);

  const degraded: string[] = [];
  const unwrap = <T,>(res: PromiseSettledResult<T>, label: string, fallback: T): T => {
    if (res.status === "fulfilled") return res.value;
    console.error(`[dashboard] ${label} failed:`, res.reason);
    degraded.push(label);
    return fallback;
  };

  const rows = unwrap(analyticsRes, "analytics", [] as Record<string, unknown>[]);
  const onboarded = unwrap(onboardedRes, "onboarded", 0);
  const allowance = unwrap(allowanceRes, "allowance", null);
  const reports = unwrap(reportsRes, "reports", [] as Record<string, unknown>[]);
  const logo = unwrap(logoRes, "logo", null);

  const patients = rows.map(normalizePatient);

  /* ---- demographics ---- */
  const male = patients.filter((p) => p.gender === "M").length;
  const female = patients.filter((p) => p.gender === "F").length;
  const gendered = male + female;

  /* ---- per-metric averages and band counts ---- */
  const metrics: MetricSummary[] = SCORE_KEYS.map((key) => {
    const values = patients.map((p) => p.scores[key]).filter((v) => v > 0);
    const counts: Record<Band, number> = { good: 0, fair: 0, poor: 0 };
    for (const v of values) counts[scoreBand(v)]++;
    return {
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      average: average(values),
      counts,
    };
  });

  /* ---- gender x age-bucket segments ---- */
  const segments: SegmentCell[] = [];
  for (const gender of ["F", "M"] as const) {
    for (let bucket = 0; bucket < AGE_BUCKETS.length; bucket++) {
      const members = patients.filter(
        (p) => p.gender === gender && ageBucketIndex(p.age) === bucket,
      );
      const averages = SCORE_KEYS.reduce(
        (acc, key) => {
          acc[key] = average(members.map((p) => p.scores[key]));
          return acc;
        },
        {} as Record<ScoreKey | "overall", number>,
      );
      averages.overall = average(members.map((p) => p.overall));
      segments.push({ gender, bucket, count: members.length, averages });
    }
  }

  /* ---- daily test volume from the rolling history ---- */
  const byDay = new Map<string, number>();
  for (const row of reports) {
    const ts = Number((row as { timestamp?: unknown }).timestamp);
    if (!Number.isFinite(ts) || ts <= 0) continue;
    const d = new Date(ts * 1000);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  const testSeries = Array.from(byDay, ([day, count]) => ({ day, count })).sort((a, b) =>
    a.day.localeCompare(b.day),
  );

  return {
    date,
    clinic: { loginId, username, logo },
    totals: {
      onboarded,
      testsOnDate: patients.length,
      averageScore: average(patients.map((p) => p.overall)),
    },
    allowance,
    demographics: {
      male,
      female,
      malePct: gendered ? Math.round((male / gendered) * 100) : 0,
      femalePct: gendered ? Math.round((female / gendered) * 100) : 0,
    },
    metrics,
    segments,
    testSeries,
    patients,
    degraded,
  };
}
