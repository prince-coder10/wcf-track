import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { ROLES, Role, PERMISSION_ACTIONS } from "@/lib/permissions";
import { logActivity } from "@/services/activity.service";

const UpdateUserSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
  login: z.string().min(3).toLowerCase().trim().optional(),
  phone: z.string().trim().optional(),
  unit: z.string().trim().optional(),
  role: z.enum(ROLES).optional(),
  status: z.enum(["active", "deactivated", "invited"]).optional(),
  canManageUsers: z.boolean().optional(),
  action: z.enum(["toggle_status", "resend_invite", "update_details"]).optional(),
});

/**
 * Helper to verify caller has permission to manage users.
 * Uses exported PERMISSION_ACTIONS rather than hardcoding.
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

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await authorizeUserManagement(req);
  if (auth.error) return auth.error;

  const resolvedParams = await Promise.resolve(context.params);
  const { id } = resolvedParams;
  if (!id) {
    return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 422 }
    );
  }

  const targetUser = await User.findById(id);
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const data = parsed.data;

  // Handle action: "resend_invite" (uses bcryptjs for token hashing)
  if (data.action === "resend_invite") {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    targetUser.invite = {
      tokenHash,
      purpose: "invite",
      expiresAt,
    };
    targetUser.status = "invited";
    await targetUser.save();

    const origin = req.headers.get("origin") || req.nextUrl.origin;
    const inviteUrl = `${origin}/invite?token=${rawToken}&uid=${targetUser._id}`;

    return NextResponse.json({
      ok: true,
      message: "New invite link generated",
      inviteToken: rawToken,
      inviteUrl,
      expiresAt: expiresAt.toISOString(),
    });
  }

  // Handle status change (Deactivate / Reactivate)
  if (data.status) {
    // Prevent self-deactivation
    if (String(targetUser._id) === auth.session!.sub && data.status === "deactivated") {
      return NextResponse.json(
        { error: "You cannot deactivate your own account." },
        { status: 400 }
      );
    }

    targetUser.status = data.status;
    if (data.status === "deactivated") {
      targetUser.deactivatedAt = new Date();
      targetUser.deactivatedBy = auth.caller!._id;
      // Invalidate existing sessions immediately
      targetUser.tokenVersion = (targetUser.tokenVersion || 0) + 1;
    } else if (data.status === "active") {
      targetUser.deactivatedAt = undefined;
      targetUser.deactivatedBy = undefined;
    }
  }

  // Handle profile / role updates
  if (data.fullName !== undefined) targetUser.fullName = data.fullName;
  if (data.login !== undefined && data.login !== targetUser.login) {
    const dup = await User.findOne({ login: data.login, _id: { $ne: targetUser._id } });
    if (dup) {
      return NextResponse.json(
        { error: "Another user already uses this login" },
        { status: 409 }
      );
    }
    targetUser.login = data.login;
  }
  if (data.phone !== undefined) targetUser.phone = data.phone;
  if (data.unit !== undefined) targetUser.unit = data.unit;
  if (data.role !== undefined) {
    targetUser.role = data.role as Role;
  }

  if (targetUser.role === "executive" && data.canManageUsers !== undefined) {
    targetUser.permissions = { canManageUsers: data.canManageUsers };
  } else if (targetUser.role !== "executive") {
    targetUser.permissions = { canManageUsers: false };
  }

  await targetUser.save();

  // Log user account change
  const actionDetail = data.status
    ? data.status === "deactivated"
      ? "Deactivated"
      : "Reactivated"
    : data.role
    ? `Role changed to ${data.role}`
    : "Profile updated";

  void logActivity({
    userId: auth.caller!._id,
    userName: auth.caller!.fullName,
    userRole: auth.caller!.role,
    action: "account",
    targetType: "user",
    targetId: targetUser._id,
    targetLabel: targetUser.fullName,
    details: actionDetail,
    metadata: {
      status: targetUser.status,
      role: targetUser.role,
    },
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: String(targetUser._id),
      fullName: targetUser.fullName,
      login: targetUser.login,
      phone: targetUser.phone,
      unit: targetUser.unit,
      role: targetUser.role,
      status: targetUser.status,
      permissions: targetUser.permissions,
      lastLoginAt: targetUser.lastLoginAt ? targetUser.lastLoginAt.toISOString() : null,
      createdAt: targetUser.createdAt.toISOString(),
    },
  });
}
