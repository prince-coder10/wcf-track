import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { setSessionCookie } from "@/lib/auth";
import { getDefaultRouteForRole } from "@/lib/permissions";
import { logActivity } from "@/services/activity.service";

const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    uid: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// GET: Validate token & check 10 min expiry before rendering form
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const uid = req.nextUrl.searchParams.get("uid");

  if (!token) {
    return NextResponse.json({ valid: false, error: "Missing reset token." }, { status: 400 });
  }

  await connectDB();

  let targetUser = null;
  if (uid) {
    targetUser = await User.findById(uid).select("+invite.tokenHash");
  }

  if (!targetUser) {
    // Candidate scan if uid not provided
    const now = new Date();
    const candidates = await User.find({
      "invite.purpose": "reset",
      "invite.expiresAt": { $gt: now },
      "invite.usedAt": { $exists: false },
    }).select("+invite.tokenHash");

    for (const c of candidates) {
      if (c.invite?.tokenHash) {
        const match = await bcrypt.compare(token, c.invite.tokenHash);
        if (match) {
          targetUser = c;
          break;
        }
      }
    }
  }

  if (!targetUser || !targetUser.invite?.tokenHash) {
    return NextResponse.json({ valid: false, error: "Password reset link is invalid or expired." }, { status: 400 });
  }

  // Check expiration (10 mins)
  if (!targetUser.invite.expiresAt || new Date(targetUser.invite.expiresAt) < new Date()) {
    return NextResponse.json({ valid: false, error: "This password reset link has expired (10 minute limit)." }, { status: 400 });
  }

  // Check if used
  if (targetUser.invite.usedAt) {
    return NextResponse.json({ valid: false, error: "This one-time reset link has already been used." }, { status: 400 });
  }

  // Verify token hash
  const match = await bcrypt.compare(token, targetUser.invite.tokenHash);
  if (!match) {
    return NextResponse.json({ valid: false, error: "Invalid password reset token." }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    user: {
      id: String(targetUser._id),
      fullName: targetUser.fullName,
      login: targetUser.login,
      role: targetUser.role,
    },
  });
}

// POST: Save new password and sign the user in
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ResetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
    }

    const { token, uid, password } = parsed.data;

    await connectDB();

    let user = null;
    if (uid) {
      user = await User.findById(uid).select("+invite.tokenHash");
    }

    if (!user) {
      const now = new Date();
      const candidates = await User.find({
        "invite.purpose": "reset",
        "invite.expiresAt": { $gt: now },
        "invite.usedAt": { $exists: false },
      }).select("+invite.tokenHash");

      for (const c of candidates) {
        if (c.invite?.tokenHash) {
          const match = await bcrypt.compare(token, c.invite.tokenHash);
          if (match) {
            user = c;
            break;
          }
        }
      }
    }

    if (!user || !user.invite?.tokenHash) {
      return NextResponse.json({ error: "Reset link is invalid or expired." }, { status: 400 });
    }

    if (!user.invite.expiresAt || new Date(user.invite.expiresAt) < new Date()) {
      return NextResponse.json({ error: "This reset link has expired." }, { status: 400 });
    }

    if (user.invite.usedAt) {
      return NextResponse.json({ error: "This link has already been used." }, { status: 400 });
    }

    const matches = await bcrypt.compare(token, user.invite.tokenHash);
    if (!matches) {
      return NextResponse.json({ error: "Invalid reset token." }, { status: 400 });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user record: reset counters, mark link used, update password
    user.passwordHash = passwordHash;
    user.status = "active";
    if (!user.invite) user.invite = {};
    user.invite.usedAt = new Date();
    user.invite.tokenHash = undefined;
    user.failedLogins = 0;
    user.lockedUntil = undefined;
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate all prior sessions
    user.lastLoginAt = new Date();

    await user.save();

    // Log security activity
    void logActivity({
      userId: user._id,
      userName: user.fullName,
      userRole: user.role,
      action: "account",
      targetType: "user",
      targetId: user._id,
      targetLabel: user.fullName,
      details: "Password reset completed via one-time recovery link",
    });

    // Automatically log user in
    await setSessionCookie({
      sub: String(user._id),
      login: user.login,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    return NextResponse.json({
      ok: true,
      message: "Password changed successfully! Redirecting…",
      redirect: getDefaultRouteForRole(user.role),
    });
  } catch (error) {
    console.error("Error setting new password:", error);
    return NextResponse.json({ error: "Failed to reset password. Please try again." }, { status: 500 });
  }
}
