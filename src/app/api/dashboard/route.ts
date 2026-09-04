import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard";
import { todayInClinicTz } from "@/lib/scores";
import { requireSession, UnauthorizedError } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** `DD/MM/YYYY`, the only shape the analytics endpoint accepts. */
const DATE_RE = /^\d{2}\/\d{2}\/\d{4}$/;

/**
 * Dashboard payload for a given day.
 *
 * `login_id` is taken from the signed session cookie, never from the query
 * string, so a caller cannot read another clinic's patients.
 */
export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const requested = new URL(request.url).searchParams.get("date");
    const date = requested && DATE_RE.test(requested) ? requested : todayInClinicTz();

    const data = await getDashboardData(session.loginId, session.username, date);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }
    console.error("[api/dashboard] failed", err);
    return NextResponse.json({ error: "Could not load dashboard data." }, { status: 500 });
  }
}
