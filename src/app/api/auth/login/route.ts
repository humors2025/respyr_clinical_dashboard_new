import { NextResponse } from "next/server";
import { login, RespyrApiError } from "@/lib/respyr-api";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Exchanges clinic credentials for a session cookie.
 *
 * The password is posted to this handler and forwarded to the PHP backend
 * server-side; it is never persisted and never reaches any client-visible
 * store.
 */
export async function POST(request: Request) {
  let username: string;
  let password: string;

  try {
    const body = await request.json();
    username = String(body?.username ?? "").trim();
    password = String(body?.password ?? "");
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (!username || !password) {
    return NextResponse.json({ error: "Enter both your admin ID and password." }, { status: 400 });
  }

  try {
    const result = await login(username, password);
    if (!result) {
      // Deliberately vague: do not reveal whether the account exists.
      return NextResponse.json({ error: "Invalid admin ID or password." }, { status: 401 });
    }

    const token = await createSessionToken({
      loginId: result.loginId,
      username: result.username,
      clinicId: result.clinicId,
    });

    const response = NextResponse.json({
      ok: true,
      user: { username: result.username, loginId: result.loginId },
    });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch (err) {
    if (err instanceof RespyrApiError) {
      console.error(`[auth/login] upstream failure: ${err.message} (${err.endpoint})`);
      return NextResponse.json(
        { error: "Sign-in service is unavailable. Please try again shortly." },
        { status: 503 },
      );
    }
    console.error("[auth/login] unexpected failure", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
