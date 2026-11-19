import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { verifyInviteToken } from "@/lib/invite";
import { setSessionCookie } from "@/lib/auth";
import { getDefaultRouteForRole } from "@/lib/permissions";

const SetPasswordSchema = z
  .object({
    token: z.string().min(1, "Invitation token is required"),
    uid: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = SetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 422 }
    );
  }

  const { token, uid, password } = parsed.data;

  // Verify the invitation token
  const { user, error } = await verifyInviteToken(token, uid);

  if (!user) {
    return NextResponse.json(
      { error: error || "Invitation link is invalid or has expired." },
      { status: 400 }
    );
  }

  // Hash the new password with bcrypt
  const passwordHash = await bcrypt.hash(password, 12);

  // Update user: activate account, store password, mark invite used, clear token
  user.passwordHash = passwordHash;
  user.status = "active";
  if (!user.invite) {
    user.invite = {};
  }
  user.invite.usedAt = new Date();
  user.invite.tokenHash = undefined;
  user.failedLogins = 0;
  user.tokenVersion = 0;
  user.lastLoginAt = new Date();

  await user.save();

  // Create session so the user is immediately logged in
  await setSessionCookie({
    sub: String(user._id),
    login: user.login,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  // Determine proper destination based on role permissions
  const destination = getDefaultRouteForRole(user.role);

  return NextResponse.json({
    ok: true,
    message: "Password set successfully! Redirecting…",
    redirect: destination,
    role: user.role,
  });
}
