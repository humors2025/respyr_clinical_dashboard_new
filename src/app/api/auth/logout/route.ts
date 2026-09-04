import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Clears the session cookie. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
