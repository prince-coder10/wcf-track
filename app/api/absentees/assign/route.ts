import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import FellowshipMember from "@/models/FellowshipMember";
import User from "@/models/User";
import { assertActiveUser } from "@/services/people.service";
import { logActivity } from "@/services/activity.service";
import { sendAssignmentPush } from "@/services/push.service";
import { z } from "zod";
import { Types } from "mongoose";

const AssignAbsenteeSchema = z.object({
  memberIds: z.array(z.string().min(1)).min(1, "Select at least one member"),
  assignedTo: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) {
    return session;
  }

  await connectDB();
  const caller = await assertActiveUser(session.sub);

  if (caller.role !== "unit_head" && caller.role !== "executive") {
    return NextResponse.json(
      { error: "Access denied. Only leaders can assign absentee members." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = AssignAbsenteeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  const { memberIds, assignedTo } = parsed.data;
  const validIds = memberIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));

  if (validIds.length === 0) {
    return NextResponse.json({ error: "No valid member IDs provided" }, { status: 400 });
  }

  const assignedToId = assignedTo && Types.ObjectId.isValid(assignedTo) ? new Types.ObjectId(assignedTo) : null;
  let targetUserName = "Unassigned";

  if (assignedToId) {
    const targetUser = await User.findById(assignedToId).select("fullName");
    targetUserName = targetUser?.fullName || "Follow-up Member";

    await FellowshipMember.updateMany(
      { _id: { $in: validIds } },
      {
        $set: {
          assignedTo: assignedToId,
          assignedAt: new Date(),
        },
      }
    );
  } else {
    await FellowshipMember.updateMany(
      { _id: { $in: validIds } },
      {
        $set: {
          assignedTo: null,
          assignedAt: null,
        },
      }
    );
  }

  void logActivity({
    userId: caller._id,
    userName: caller.fullName,
    userRole: caller.role,
    action: "reassigned",
    targetType: "user",
    targetLabel: `${validIds.length} Absentee Member(s)`,
    details: `Assigned to ${targetUserName}`,
    metadata: { assignedToId, memberCount: validIds.length },
  });

  if (assignedToId) {
    void sendAssignmentPush(assignedToId.toString(), validIds.length);
  }

  return NextResponse.json({
    ok: true,
    message: `Updated assignment for ${validIds.length} member(s).`,
  });
}
