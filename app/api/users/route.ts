import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { ROLES, PERMISSION_ACTIONS } from "@/lib/permissions";
import { logActivity } from "@/services/activity.service";

const CreateUserSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").trim(),
  login: z
    .string()
    .min(3, "Email or username must be at least 3 characters")
    .toLowerCase()
    .trim(),
  role: z.enum(ROLES, {
    message: "Invalid role selected",
  }),
  unit: z.string().trim().optional().default("Follow-up"),
  phone: z.string().trim().optional(),
  canManageUsers: z.boolean().optional().default(false),
});

/**
 * Helper to verify that the calling user has permission to manage users.
 * Uses the exported PERMISSION_ACTIONS rather than hardcoding permission keys.
 */
async function authorizeUserManagement(req: NextRequest) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) {
    return { error: session, caller: null, session: null };
  }

  await connectDB();
  const caller = await User.findById(session.sub);
  if (!caller || caller.status !== "active") {
    return {
      error: NextResponse.json(
        { error: "Account inactive or not found" },
        { status: 403 }
      ),
      caller: null,
      session: null,
    };
  }

  if (!caller.can(PERMISSION_ACTIONS.USERS_MANAGE)) {
    return {
      error: NextResponse.json(
        { error: "Forbidden: You do not have permission to manage users" },
        { status: 403 }
      ),
      caller: null,
      session: null,
    };
  }

  return { error: null, caller, session };
}

/**
 * GET /api/users
 * Returns list of users.
 */
export async function GET(req: NextRequest) {
  const auth = await authorizeUserManagement(req);
  if (auth.error) return auth.error;

  const users = await User.find({})
    .select("fullName login phone unit role status lastLoginAt createdAt permissions invite")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    users: users.map((u) => ({
      id: String(u._id),
      fullName: u.fullName,
      login: u.login,
      phone: u.phone || "",
      unit: u.unit || "Follow-up",
      role: u.role,
      status: u.status,
      permissions: u.permissions || { canManageUsers: false },
      lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      createdAt: u.createdAt ? u.createdAt.toISOString() : null,
      hasPendingInvite: u.status === "invited" && !!u.invite?.expiresAt && new Date(u.invite.expiresAt) > new Date(),
    })),
  });
}

/**
 * POST /api/users
 * Creates a new user and generates a 24-hour one-time activation invite token.
 * Uses bcryptjs for hashing the one-time token.
 */
export async function POST(req: NextRequest) {
  const auth = await authorizeUserManagement(req);
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 422 }
    );
  }

  const { fullName, login, role, unit, phone, canManageUsers } = parsed.data;

  // Check if login is already registered
  const existing = await User.findOne({ login });
  if (existing) {
    return NextResponse.json(
      { error: `An account with login "${login}" already exists.` },
      { status: 409 }
    );
  }

  // Generate a random one-time token and hash it using bcryptjs
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = await bcrypt.hash(rawToken, 10);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const newUser = new User({
    fullName,
    login,
    phone: phone || undefined,
    unit: unit || "Follow-up",
    role,
    permissions: {
      canManageUsers: role === "executive" ? !!canManageUsers : false,
    },
    status: "invited",
    invite: {
      tokenHash,
      purpose: "invite",
      expiresAt,
    },
    createdBy: auth.session!.sub,
    tokenVersion: 0,
  });

  await newUser.save();

  void logActivity({
    userId: auth.caller!._id,
    userName: auth.caller!.fullName,
    userRole: auth.caller!.role,
    action: "account",
    targetType: "user",
    targetId: newUser._id,
    targetLabel: newUser.fullName,
    details: `Account created, role: ${newUser.role}`,
    metadata: {
      unit: newUser.unit,
      role: newUser.role,
      invited: true,
    },
  });

  // Construct invite URL
  const origin = req.headers.get("origin") || req.nextUrl.origin;
  const inviteUrl = `${origin}/invite?token=${rawToken}&uid=${newUser._id}`;

  return NextResponse.json(
    {
      ok: true,
      user: {
        id: String(newUser._id),
        fullName: newUser.fullName,
        login: newUser.login,
        phone: newUser.phone,
        unit: newUser.unit,
        role: newUser.role,
        status: newUser.status,
        permissions: newUser.permissions,
        createdAt: newUser.createdAt.toISOString(),
      },
      inviteToken: rawToken,
      inviteUrl,
      expiresAt: expiresAt.toISOString(),
    },
    { status: 201 }
  );
}
