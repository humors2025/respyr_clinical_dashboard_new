import { SignJWT, jwtVerify } from "jose";

/**
 * Session token primitives.
 *
 * Kept free of `next/headers` so that middleware (Edge runtime) can verify a
 * token without pulling in server-only request APIs.
 */

export const SESSION_COOKIE = "respyr_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8h — a clinic shift

export interface Session {
  loginId: string;
  username: string;
  clinicId: string | null;
}

let cachedKey: Uint8Array | null = null;

function secretKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or shorter than 32 characters. " +
        "Set it in .env.local for development and in the Amplify console for deployments.",
    );
  }
  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}

export async function createSessionToken(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.loginId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const loginId = typeof payload.loginId === "string" ? payload.loginId : "";
    if (!loginId) return null;
    return {
      loginId,
      username: typeof payload.username === "string" ? payload.username : loginId,
      clinicId: typeof payload.clinicId === "string" ? payload.clinicId : null,
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
