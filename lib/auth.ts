import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User, { IUser } from "@/models/User";
import {
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
  SessionPayload,
  signToken,
  verifyToken,
  requireAuthLight,
} from "./auth-token";

export {
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
  signToken,
  verifyToken,
  requireAuthLight,
};
export type { SessionPayload };

// ─── Database Session Validation Helper (Node.js runtime) ─────────────────────

/**
 * Validates a verified token against MongoDB to ensure:
 * 1. User still exists
 * 2. User status is "active" (deactivated accounts are immediately blocked)
 * 3. tokenVersion matches the database (bumping tokenVersion forces immediate logout)
 *
 * If valid, returns the fresh user document; if invalid, returns null.
 */
export async function validateSessionUser(
  payload: SessionPayload
): Promise<IUser | null> {
  try {
    await connectDB();
    const user = await User.findById(payload.sub)
      .select("status tokenVersion role login fullName permissions")
      .lean();

    if (!user) return null;
    if (user.status !== "active") return null;
    if (typeof user.tokenVersion === "number" && user.tokenVersion !== payload.tokenVersion) {
      return null;
    }

    return user as unknown as IUser;
  } catch {
    return null;
  }
}

// ─── Cookie Helpers (Node.js runtime) ─────────────────────────────────────────

/**
 * Write the session cookie (called after a successful login).
 * Always HttpOnly + SameSite=Lax. Secure in production.
 */
export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signToken(payload);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/**
 * Delete the session cookie (called on logout).
 */
export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/**
 * Read and verify the session cookie from the current request context.
 * Performs a DB round-trip check against status and tokenVersion so deactivated
 * or revoked sessions are immediately invalidated.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await validateSessionUser(payload);
  if (!user) return null;

  // Sync latest role from DB in case user was promoted/demoted
  return {
    ...payload,
    role: user.role,
    login: user.login,
    tokenVersion: user.tokenVersion,
  };
}

// ─── Route Guard (Node.js runtime) ────────────────────────────────────────────

/**
 * Extract and verify the session token from an incoming Request object.
 * Re-validates the user status and tokenVersion against MongoDB.
 *
 * Returns SessionPayload on success, or a 401 NextResponse to pass through.
 */
export async function requireAuth(
  req: NextRequest
): Promise<SessionPayload | NextResponse> {
  const authHeader = req.headers.get("authorization");
  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    token = req.cookies.get(SESSION_COOKIE)?.value;
  }

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "Session expired or invalid" },
      { status: 401 }
    );
  }

  // Validate live user status and tokenVersion in the database
  const user = await validateSessionUser(payload);
  if (!user) {
    return NextResponse.json(
      { error: "Session revoked or account inactive" },
      { status: 401 }
    );
  }

  // Always reflect the live role from DB
  return {
    ...payload,
    role: user.role,
    login: user.login,
    tokenVersion: user.tokenVersion,
  };
}
