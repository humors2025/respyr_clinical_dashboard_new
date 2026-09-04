import "server-only";

/**
 * Server-side client for the existing Respyr PHP backend.
 *
 * Every call in here runs on the Next server, never in the browser. Two reasons:
 *
 *  1. CORS. `opd-encry-age-gender-diversity-v2.php` answers with
 *     `Access-Control-Allow-Origin: https://portal.respyr.in`, so a browser on
 *     any other origin is refused. Server-to-server requests are not subject to
 *     CORS at all.
 *  2. Tenancy. `login_id` identifies the clinic and every endpoint trusts it
 *     blindly. It is read from the signed session cookie here so a client can
 *     never substitute another clinic's id.
 */

const API_BASE = process.env.RESPYR_API_BASE ?? "https://humorstech.com/api";
const CLINIC_BASE =
  process.env.RESPYR_CLINIC_BASE ?? "https://humorstech.com/humors_app/app_final/clinical";

const TIMEOUT_MS = Number(process.env.RESPYR_API_TIMEOUT_MS ?? 15000);

export class RespyrApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly endpoint: string,
  ) {
    super(message);
    this.name = "RespyrApiError";
  }
}

async function request(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    throw new RespyrApiError(
      aborted ? `Upstream timed out after ${TIMEOUT_MS}ms` : "Upstream request failed",
      504,
      url,
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The PHP endpoints are inconsistent: some return JSON, some return JSON with a
 * stray notice prepended, some return an HTML error page with a 200. Parse
 * defensively rather than letting `res.json()` throw an opaque error.
 */
async function parseJson<T>(res: Response, endpoint: string): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    throw new RespyrApiError(`Upstream returned ${res.status}`, res.status, endpoint);
  }
  const start = text.search(/[[{]/);
  if (start === -1) {
    throw new RespyrApiError("Upstream returned a non-JSON body", 502, endpoint);
  }
  try {
    return JSON.parse(text.slice(start)) as T;
  } catch {
    throw new RespyrApiError("Upstream returned malformed JSON", 502, endpoint);
  }
}

function postForm(url: string, body: Record<string, string>) {
  return request(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export interface LoginResult {
  loginId: string;
  username: string;
  clinicId: string | null;
}

/**
 * Verifies credentials against `opd-login_v2.php`.
 *
 * Returns `null` for a credential rejection and throws only when the upstream
 * is genuinely broken — the caller maps those to 401 and 503 respectively.
 * The endpoint answers 400/401 with a JSON error body for bad input, so those
 * statuses must not be treated as transport failures.
 *
 * The legacy portal set the JWT's `login_id` claim from the response's
 * `username` field, and every downstream endpoint keys off that value, so the
 * same precedence is preserved here.
 */
export async function login(username: string, password: string): Promise<LoginResult | null> {
  const endpoint = `${API_BASE}/opd-login_v2.php`;
  const res = await postForm(endpoint, { username, password });

  // 400 (missing fields) and 401 (unknown user / wrong password) are valid
  // answers, not outages.
  if (res.status === 400 || res.status === 401 || res.status === 403) return null;

  const data = await parseJson<Record<string, unknown>>(res, endpoint);
  if (!data || data.error != null || data.id == null) return null;

  const resolved = String(data.username ?? data.login_id ?? username).trim();
  if (!resolved) return null;

  return {
    loginId: resolved,
    username: resolved,
    clinicId: String(data.id),
  };
}

/* ------------------------------------------------------------------ */
/* Dashboard data                                                      */
/* ------------------------------------------------------------------ */

export type AnalyticsRow = Record<string, unknown>;

/** Per-test rows for a given day. `date` is `DD/MM/YYYY`. */
export async function fetchAnalytics(loginId: string, date: string): Promise<AnalyticsRow[]> {
  const endpoint = `${API_BASE}/opd-encry-age-gender-diversity-v2.php`;
  const res = await postForm(endpoint, { login_id: loginId, date });
  const data = await parseJson<unknown>(res, endpoint);
  return Array.isArray(data) ? (data as AnalyticsRow[]) : [];
}

/** Rolling multi-week history; each row carries a unix `timestamp`. */
export async function fetchWeeklyReports(loginId: string): Promise<AnalyticsRow[]> {
  const endpoint = `${API_BASE}/opd-encry-data-weeks_v2.php`;
  const res = await postForm(endpoint, { login_id: loginId });
  const data = await parseJson<unknown>(res, endpoint);
  return Array.isArray(data) ? (data as AnalyticsRow[]) : [];
}

/**
 * One row per subject: their most recent scores, cumulative test count and
 * last-tested timestamp. Backs the test-history roster.
 */
export async function fetchSubjectRoster(loginId: string): Promise<AnalyticsRow[]> {
  const endpoint = `${API_BASE}/opd-encry-data_v2.php?login_id=${encodeURIComponent(loginId)}`;
  const res = await postForm(endpoint, { login_id: loginId });
  const data = await parseJson<unknown>(res, endpoint);
  return Array.isArray(data) ? (data as AnalyticsRow[]) : [];
}

/** Total subjects onboarded by this clinic. */
export async function fetchOnboardedCount(loginId: string): Promise<number> {
  const endpoint = `${API_BASE}/opd-onboard-pat_v2.php`;
  const res = await postForm(endpoint, { login_id: loginId });
  const data = await parseJson<{ onboarded?: unknown }>(res, endpoint);
  const n = Number(data?.onboarded);
  return Number.isFinite(n) ? n : 0;
}

export interface Allowance {
  allowed: boolean;
  used: number;
  total: number;
}

/** Test quota for the clinic's plan. */
export async function fetchAllowance(loginId: string): Promise<Allowance | null> {
  const endpoint = `${API_BASE}/encrp_testallow_v2.php?login_id=${encodeURIComponent(loginId)}`;
  const res = await request(endpoint, { method: "GET" });
  const data = await parseJson<Record<string, unknown>>(res, endpoint);
  if (!data) return null;
  return {
    allowed: data.test_allow === true || data.test_allow === "true",
    used: Number(data.clinical_score_count) || 0,
    total: Number(data.test_no) || 0,
  };
}

/* ------------------------------------------------------------------ */
/* Subjects                                                            */
/* ------------------------------------------------------------------ */

/** Every subject profile registered to the clinic. */
export async function fetchSubjects(loginId: string): Promise<AnalyticsRow[]> {
  const endpoint = `${CLINIC_BASE}/fetch_clinical_profiles2.php?clinic_name=${encodeURIComponent(loginId)}`;
  const res = await request(endpoint, { method: "GET" });
  const data = await parseJson<{ status?: string; data?: unknown }>(res, endpoint);
  if (data?.status !== "success" || !Array.isArray(data.data)) return [];
  return data.data as AnalyticsRow[];
}

export interface SubjectUpdate {
  age: number;
  height: number;
  weight: number;
}

/**
 * Updates a subject's measurements.
 *
 * Name and gender are intentionally not updatable — the legacy portal disabled
 * those inputs, and the upstream endpoint accepts no such parameters.
 */
export async function updateSubject(
  loginId: string,
  profileId: string,
  patch: SubjectUpdate,
): Promise<{ ok: boolean; message: string }> {
  const params = new URLSearchParams({
    login_id: loginId,
    profile_id: profileId,
    age: String(patch.age),
    height: String(patch.height),
    weight: String(patch.weight),
  });
  const endpoint = `${CLINIC_BASE}/update_clinical_profile.php?${params}`;
  const res = await request(endpoint, { method: "GET" });
  const data = await parseJson<{ status?: string; message?: string }>(res, endpoint);
  return {
    ok: data?.status === "success",
    message: String(data?.message ?? (data?.status === "success" ? "Profile updated." : "Update failed.")),
  };
}

/** Clinic logo, returned by the PHP as base64 in a JSON envelope. */
export async function fetchClinicLogo(loginId: string): Promise<string | null> {
  const endpoint = `${CLINIC_BASE}/fetch_logo1.php?clinic_name=${encodeURIComponent(loginId)}`;
  try {
    const res = await request(endpoint, { method: "GET" });
    const data = await parseJson<{ status?: string; logo_blob?: string }>(res, endpoint);
    if (data?.status === "success" && typeof data.logo_blob === "string" && data.logo_blob.length > 100) {
      return `data:image/png;base64,${data.logo_blob}`;
    }
  } catch {
    // A missing logo is not an error — the UI falls back to an initial avatar.
  }
  return null;
}
