import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { setSessionCookie } from "@/lib/auth";
import type { SessionPayload } from "@/lib/auth";
import { getDefaultRouteForRole } from "@/lib/permissions";

// ─── Input Validation ─────────────────────────────────────────────────────────

const LoginSchema = z.object({
  login: z
    .string("Email or username is required")
    .min(1, "Email or username is required")
    .toLowerCase()
    .trim(),
  password: z
    .string("Password is required")
    .min(1, "Password is required"),
});

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  console.log("[login] POST /api/auth/login → request received");

  // 1. Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    console.warn(`[login] ❌ validation failed — ${parsed.error.issues[0].message}`);
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 422 }
    );
  }

  const { login, password } = parsed.data;
  console.log(`[login] → attempting login for: ${login}`);

  // 2. Connect to DB
  console.log("[login] → connecting to database…");
  await connectDB();
  console.log("[login] ✅ DB connected");

  // 3. Look up user (include passwordHash and lockout fields in this query)
  console.log(`[login] → looking up user: ${login}`);
  const user = await User.findOne({ login })
    .select("+passwordHash login failedLogins lockedUntil status tokenVersion role")
    .lean();

  // 4. Generic "invalid credentials" — never reveal which field is wrong
  const INVALID = NextResponse.json(
    { error: "Invalid credentials" },
    { status: 401 }
  );

  if (!user) {
    console.warn(`[login] ❌ user not found: ${login}`);
    return INVALID;
  }
  console.log(`[login] ✅ user found — id=${user._id} status=${user.status} role=${user.role} failedLogins=${user.failedLogins}`);

  // 5. Account status check
  if (user.status === "deactivated") {
    console.warn(`[login] ❌ account deactivated — ${login}`);
    return NextResponse.json(
      { error: "Your account has been deactivated. Contact your unit head." },
      { status: 403 }
    );
  }

  if (user.status === "invited") {
    console.warn(`[login] ❌ account not yet activated (invited) — ${login}`);
    return NextResponse.json(
      { error: "Please accept your invitation before logging in." },
      { status: 403 }
    );
  }

  // 6. Lockout check
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remaining = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60_000
    );
    console.warn(`[login] ❌ account locked — ${login} — ${remaining}min remaining`);
    return NextResponse.json(
      {
        error: `Account temporarily locked due to too many failed attempts. Try again in ${remaining} minute(s).`,
      },
      { status: 429 }
    );
  }

  // 7. Password verification
  console.log("[login] → verifying password hash…");
  const passwordOk =
    user.passwordHash && (await bcrypt.compare(password, user.passwordHash));

  if (!passwordOk) {
    const newFailedCount = (user.failedLogins ?? 0) + 1;
    console.warn(`[login] ❌ wrong password — failedAttempts=${newFailedCount}/${MAX_FAILED_ATTEMPTS}`);
    // Increment failed login counter; lock if threshold reached
    const updatePayload: Record<string, unknown> = {
      failedLogins: newFailedCount,
    };

    if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
      updatePayload.lockedUntil = new Date(
        Date.now() + LOCKOUT_MINUTES * 60_000
      );
      console.warn(`[login] ⚠️  account locked for ${LOCKOUT_MINUTES}min — ${login}`);
    }

    await User.updateOne({ _id: user._id }, { $set: updatePayload });
    return INVALID;
  }

  console.log("[login] ✅ password verified");

  // 8. Successful login — reset lockout counters
  console.log("[login] → resetting lockout counters…");
  await User.updateOne(
    { _id: user._id },
    {
      $set: { failedLogins: 0, lastLoginAt: new Date() },
      $unset: { lockedUntil: "" },
    }
  );

  // 9. Issue session cookie
  console.log(`[login] → issuing session cookie for sub=${user._id} role=${user.role}`);
  const sessionPayload: SessionPayload = {
    sub: String(user._id),
    login: user.login || login,
    role: user.role,
    tokenVersion: user.tokenVersion ?? 0,
  };

  await setSessionCookie(sessionPayload);
  console.log(`[login] ✅ login successful — ${login} (${user.role})`);

  return NextResponse.json({
    ok: true,
    user: {
      id: String(user._id),
      login: user.login,
      role: user.role,
    },
    redirect: getDefaultRouteForRole(user.role),
  });
}
