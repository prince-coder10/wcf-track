import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { ROLES, type Role } from "@/lib/permissions";

// ─── Constants ────────────────────────────────────────────────────────────────

export const SESSION_COOKIE = "wcf_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 hours

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET env variable is missing or too short (minimum 32 characters)."
    );
  }
  return new TextEncoder().encode(secret);
}

// ─── Token Payload ────────────────────────────────────────────────────────────

export interface SessionPayload extends JWTPayload {
  sub: string;          // User._id (MongoDB ObjectId string)
  login: string;
  role: Role;
  tokenVersion: number; // must match db; bump to invalidate all sessions
}

// ─── Token Helpers (Edge Runtime Compatible) ───────────────────────────────────

/**
 * Sign a new JWT and return the compact token string.
 */
export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getJwtSecret());
}

/**
 * Cryptographically verifies a JWT string using Web Crypto (Edge-safe).
 * Explicitly pins algorithm to HS256 and validates claims structure.
 */
export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      !payload.sub ||
      typeof payload.login !== "string" ||
      typeof payload.tokenVersion !== "number" ||
      typeof payload.role !== "string" ||
      !ROLES.includes(payload.role as Role)
    ) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[auth] verifyToken ❌ invalid token claims structure");
      }
      return null;
    }

    const sessionPayload: SessionPayload = {
      ...payload,
      sub: payload.sub,
      login: payload.login,
      role: payload.role as Role,
      tokenVersion: payload.tokenVersion,
    };

    return sessionPayload;
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[auth] verifyToken ❌ invalid — ${msg}`);
    }
    return null;
  }
}

/**
 * Lightweight token-only signature check (no DB round-trip, Edge-safe).
 */
export async function requireAuthLight(
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

  return payload;
}
