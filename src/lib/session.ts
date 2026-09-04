import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, type Session } from "./session-token";

export {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  verifySessionToken,
  sessionCookieOptions,
  type Session,
} from "./session-token";

export class UnauthorizedError extends Error {
  constructor() {
    super("Not authenticated");
    this.name = "UnauthorizedError";
  }
}

/** Reads and verifies the session for the current request, or null. */
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Same as {@link getSession} but throws when unauthenticated — for route
 * handlers where an anonymous caller is a programming error, not a branch.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}
