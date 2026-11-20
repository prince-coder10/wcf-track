import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import FellowshipMember, { ABSENTEE_STATUSES } from "@/models/FellowshipMember";
import { assertActiveUser } from "@/services/people.service";
import { canUserViewAbsentee } from "@/services/absentee.service";
import { logActivity } from "@/services/activity.service";
import { sendNotificationToUser } from "@/services/push.service";
import { z } from "zod";
import { Types } from "mongoose";

const LogCheckInSchema = z.object({
  method: z.enum(["whatsapp", "call", "visit"]),
  reached: z.boolean(),
  notes: z.string().optional(),
  status: z.enum(ABSENTEE_STATUSES).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) {
    return session;
  }

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
  }

  await connectDB();
  const caller = await assertActiveUser(session.sub);

  const member = await FellowshipMember.findById(id);
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (!canUserViewAbsentee(caller.role, String(caller._id), member)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = LogCheckInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  const { method, reached, notes, status } = parsed.data;
  const now = new Date();

  member.checkInCount = (member.checkInCount || 0) + 1;
  member.lastContactAt = now;
  if (notes) member.notes = notes;
  if (status) {
    member.status = status;
    member.statusChangedAt = now;
  } else if (reached) {
    member.status = "contacted";
    member.statusChangedAt = now;
  }

  await member.save();

  void logActivity({
    userId: caller._id,
    userName: caller.fullName,
    userRole: caller.role,
    action: "check_in",
    targetType: "person",
    targetId: member._id,
    targetLabel: member.fullName,
    details: `${method.toUpperCase()}, ${reached ? "reached" : "no answer"}${status ? ` (${status})` : ""}`,
    metadata: { method, reached, notes },
  });

  // Send in-app notification for the check-in
  void sendNotificationToUser({
    userId: String(caller._id),
    title: "Absentee Check-in Logged",
    message: `${member.fullName} — ${method.toUpperCase()}, ${reached ? "reached" : "no answer"}`,
    type: "system",
    priority: "in_app",
    link: `/dashboard/absentees`,
  });

  // If assigned to someone else, notify them too
  if (member.assignedTo && String(member.assignedTo) !== String(caller._id)) {
    void sendNotificationToUser({
      userId: String(member.assignedTo),
      title: "Check-in on Your Assigned Absentee",
      message: `${caller.fullName} logged a check-in for ${member.fullName}`,
      type: "system",
      priority: "in_app",
      link: `/dashboard/absentees`,
    });
  }

  return NextResponse.json({
    ok: true,
    member: {
      _id: String(member._id),
      status: member.status,
      checkInCount: member.checkInCount,
      lastContactAt: member.lastContactAt.toISOString(),
    },
  });
}
