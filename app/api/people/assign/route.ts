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

const AssignSchema = z.object({
  personIds: z.array(z.string().min(1)).min(1, "Select at least one person"),
  assignedTo: z.string().nullable().optional(), // string user ID or null for unassigned
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = AssignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 422 }
    );
  }

  const { personIds, assignedTo } = parsed.data;

  await connectDB();

  const assignedToId = assignedTo ? new Types.ObjectId(assignedTo) : null;
  const currentUserId = new Types.ObjectId(session.sub);

  const validObjectIds = personIds
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));

  if (validObjectIds.length === 0) {
    return NextResponse.json({ error: "No valid person IDs provided" }, { status: 400 });
  }

  // Fetch affected people to capture before state & names
  const affectedPeople = await Person.find({ _id: { $in: validObjectIds } })
    .select("fullName assignedTo")
    .populate("assignedTo", "fullName");

  const actor = await User.findById(session.sub).select("fullName");
  const actorName = actor?.fullName || "Admin";

  let targetUserName = "Unassigned";
  if (assignedToId) {
    const targetUser = await User.findById(assignedToId).select("fullName");
    targetUserName = targetUser?.fullName || "Follow-up Member";
  }

  // Update records
  if (assignedToId) {
    await Person.updateMany(
      { _id: { $in: validObjectIds } },
      {
        $set: {
          assignedTo: assignedToId,
          assignedAt: new Date(),
          status: "assigned",
        },
        $push: {
          assignmentHistory: {
            to: assignedToId,
            by: currentUserId,
            at: new Date(),
          },
        },
      }
    );
  } else {
    // Unassign
    await Person.updateMany(
      { _id: { $in: validObjectIds } },
      {
        $set: {
          assignedTo: null,
          assignedAt: null,
          status: "new",
        },
      }
    );
  }

  // Log activity for each reassigned person
  for (const person of affectedPeople) {
    const prevName = (person.assignedTo as { fullName?: string })?.fullName || "Unassigned";
    const detail =
      prevName === "Unassigned"
        ? `Assigned to ${targetUserName}`
        : `${prevName} to ${targetUserName}`;

    void logActivity({
      userId: session.sub,
      userName: actorName,
      userRole: session.role,
      action: "reassigned",
      targetType: "person",
      targetId: person._id,
      targetLabel: person.fullName,
      details: detail,
      metadata: {
        from: (person.assignedTo as { _id?: unknown })?._id || null,
        to: assignedToId,
      },
    });
  }

  // Trigger push notification if assigned to a follow-up member
  if (assignedToId) {
    void sendAssignmentPush(assignedToId.toString(), validObjectIds.length);
  }

  return NextResponse.json({
    ok: true,
    message: `Updated assignment for ${validObjectIds.length} person(s).`,
  });
}
