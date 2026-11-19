import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user's public profile.
 * Also validates the tokenVersion against the database to detect
 * force-logouts (e.g. password change, admin deactivation).
 *
 * This endpoint is designed to be called periodically by the client
 * (e.g. every 5 minutes, or on each page focus) to verify the session
 * is still valid without requiring a full re-login.
 */
export async function GET(req: NextRequest) {
  console.log("[me] GET /api/auth/me → verifying session…");

  // 1. Verify the JWT signature and expiry
  const session = await requireAuth(req);
  if (session instanceof NextResponse) {
    console.warn("[me] ❌ JWT check failed — returning 401");
    return session;
  }
  console.log(`[me] ✅ JWT valid — sub=${session.sub} tokenVersion=${session.tokenVersion}`);

  // 2. DB round-trip: check tokenVersion and status (detects force-logouts)
  console.log("[me] → DB round-trip: checking tokenVersion & status…");
  await connectDB();

  const user = await User.findById(session.sub)
    .select("fullName login role status tokenVersion permissions")
    .lean();

  if (!user) {
    console.warn(`[me] ❌ user not found in DB — sub=${session.sub}`);
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }
  console.log(`[me] ✅ user found — login=${user.login} status=${user.status} dbTokenVersion=${user.tokenVersion} jwtTokenVersion=${session.tokenVersion}`);

  // tokenVersion mismatch means the server has invalidated all sessions
  if (user.tokenVersion !== session.tokenVersion) {
    console.warn(`[me] ❌ tokenVersion mismatch — db=${user.tokenVersion} jwt=${session.tokenVersion} — session force-invalidated`);
    return NextResponse.json(
      { error: "Session invalidated. Please log in again." },
      { status: 401 }
    );
  }

  if (user.status !== "active") {
    console.warn(`[me] ❌ account not active — status=${user.status}`);
    return NextResponse.json(
      { error: "Account is no longer active." },
      { status: 403 }
    );
  }

  console.log(`[me] ✅ session valid — returning user profile for ${user.login}`);
  return NextResponse.json({
    user: {
      id: String(user._id),
      fullName: user.fullName,
      login: user.login,
      role: user.role,
      permissions: user.permissions,
    },
  });
}
