import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import Person from "@/models/Person";
import User from "@/models/User";
import { roleHasPermission, PERMISSION_ACTIONS } from "@/lib/permissions";
import { logActivity } from "@/services/activity.service";
import { sendAssignmentPush } from "@/services/push.service";
import { z } from "zod";
import { Types } from "mongoose";

const DistributeEvenlySchema = z.object({
  personIds: z.array(z.string().min(1)).optional(), // if omitted or empty, distribute ALL unassigned
  targetUserIds: z.array(z.string().min(1)).optional(), // if omitted or empty, distribute to all active follow-up members
});

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) {
    return session;
  }

  const role = session.role;
  const canAssign =
    roleHasPermission(role, PERMISSION_ACTIONS.PEOPLE_ASSIGN) ||
    role === "unit_head" ||
    role === "executive";

  if (!canAssign) {
    return NextResponse.json(
      { error: "You do not have permission to assign people." },
      { status: 403 }
    );
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is acceptable
  }

  const parsed = DistributeEvenlySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 422 }
    );
  }

  await connectDB();

  // 1. Resolve recipients
  let targetUsers;
  if (parsed.data.targetUserIds && parsed.data.targetUserIds.length > 0) {
    const validTargetIds = parsed.data.targetUserIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    targetUsers = await User.find({
      _id: { $in: validTargetIds },
      status: "active",
    }).select("fullName _id");
  } else {
    // Default to active follow_up, unit_head, and executive
    targetUsers = await User.find({
      role: { $in: ["follow_up", "unit_head", "executive"] },
      status: "active",
    }).select("fullName _id");
  }

  if (targetUsers.length === 0) {
    return NextResponse.json(
      { error: "No active follow-up members available to assign to." },
      { status: 400 }
    );
  }

  // 2. Resolve persons to assign
  let personsToAssign;
  if (parsed.data.personIds && parsed.data.personIds.length > 0) {
    const validPersonIds = parsed.data.personIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    personsToAssign = await Person.find({ _id: { $in: validPersonIds } }).select(
      "_id fullName assignedTo"
    );
  } else {
    // Default to all unassigned people
    personsToAssign = await Person.find({ assignedTo: null }).select(
      "_id fullName assignedTo"
    );
  }

  if (personsToAssign.length === 0) {
    return NextResponse.json(
      { error: "No unassigned people found to distribute." },
      { status: 400 }
    );
  }

  const actor = await User.findById(session.sub).select("fullName");
  const actorName = actor?.fullName || "Admin";
  const now = new Date();

  // 3. Round-robin assignment
  const userAssignmentCounts: Record<string, number> = {};
  const bulkOps = [];
  const notifications: { userId: string; count: number }[] = [];

  for (let i = 0; i < personsToAssign.length; i++) {
    const person = personsToAssign[i];
    const targetUser = targetUsers[i % targetUsers.length];
    const targetUserIdStr = targetUser._id.toString();

    userAssignmentCounts[targetUserIdStr] =
      (userAssignmentCounts[targetUserIdStr] || 0) + 1;

    bulkOps.push({
      updateOne: {
        filter: { _id: person._id },
        update: {
          $set: {
            assignedTo: targetUser._id,
            assignedAt: now,
            status: "assigned",
          },
          $push: {
            assignmentHistory: {
              from: person.assignedTo || null,
              to: targetUser._id,
              by: new Types.ObjectId(session.sub),
              at: now,
            },
          },
        },
      },
    });
  }

  if (bulkOps.length > 0) {
    await Person.bulkWrite(bulkOps);
  }

  // 4. Send notifications & log activities
  for (const [userId, count] of Object.entries(userAssignmentCounts)) {
    notifications.push({ userId, count });
    void sendAssignmentPush(userId, count);
  }

  void logActivity({
    userId: session.sub,
    userName: actorName,
    userRole: session.role,
    action: "reassigned",
    targetType: "system",
    targetLabel: "Even Distribution",
    details: `Distributed ${personsToAssign.length} person(s) evenly among ${targetUsers.length} member(s)`,
    metadata: {
      totalAssigned: personsToAssign.length,
      recipientsCount: targetUsers.length,
    },
  });

  return NextResponse.json({
    success: true,
    message: `Successfully assigned ${personsToAssign.length} person(s) evenly across ${targetUsers.length} team member(s).`,
    totalAssigned: personsToAssign.length,
    assignedToCount: targetUsers.length,
  });
}
