import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import Person from "@/models/Person";
import CheckIn from "@/models/CheckIn";
import { assertActiveUser } from "@/services/people.service";
import { canUserViewPerson } from "@/services/checkin.service";
import { Types } from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) {
    return session;
  }

  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid person ID" }, { status: 400 });
  }

  await connectDB();
  const caller = await assertActiveUser(session.sub);

  const person = await Person.findById(id)
    .populate("evangelist", "fullName login role")
    .populate("assignedTo", "fullName login role")
    .populate("createdBy", "fullName")
    .populate("assignmentHistory.from", "fullName")
    .populate("assignmentHistory.to", "fullName")
    .populate("assignmentHistory.by", "fullName");

  if (!person) {
    return NextResponse.json({ error: "Person not found" }, { status: 404 });
  }

  if (!canUserViewPerson(caller.role, String(caller._id), person)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Fetch check-in history
  const checkIns = await CheckIn.find({ person: person._id })
    .sort({ createdAt: -1 })
    .populate("user", "fullName role")
    .lean();

  let lastContactDays: number | null = null;
  if (person.lastContactAt) {
    const diffMs = Date.now() - new Date(person.lastContactAt).getTime();
    lastContactDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  return NextResponse.json({
    person: {
      _id: String(person._id),
      fullName: person.fullName,
      phone: person.phone,
      phoneNormalized: person.phoneNormalized,
      hall: person.hall,
      roomOrLocation: person.roomOrLocation || null,
      level: person.level || null,
      course: person.course || null,
      response: person.response,
      status: person.status,
      preferredContact: person.preferredContact || null,
      currentChurch: person.currentChurch || null,
      prayerRequest: person.prayerRequest || null,
      handoffNote: person.handoffNote || null,
      evangelizedAt: person.evangelizedAt ? new Date(person.evangelizedAt).toISOString() : null,
      evangelist: person.evangelist
        ? {
            _id: String((person.evangelist as { _id: unknown; fullName?: string })._id),
            fullName: (person.evangelist as { fullName?: string }).fullName || "Unknown",
          }
        : null,
      assignedTo: person.assignedTo
        ? {
            _id: String((person.assignedTo as { _id: unknown; fullName?: string })._id),
            fullName: (person.assignedTo as { fullName?: string }).fullName || "Unassigned",
          }
        : null,
      checkInCount: person.checkInCount || 0,
      lastContactAt: person.lastContactAt ? new Date(person.lastContactAt).toISOString() : null,
      lastContactDays,
      nextFollowUpAt: person.nextFollowUpAt ? new Date(person.nextFollowUpAt).toISOString() : null,
      createdBy: person.createdBy ? (person.createdBy as { fullName?: string }).fullName : "Unknown",
      createdAt: person.createdAt ? new Date(person.createdAt).toISOString() : null,
      assignmentHistory: (person.assignmentHistory || []).map((h) => ({
        toName: (h.to as unknown as { fullName?: string })?.fullName || "Unassigned",
        byName: (h.by as unknown as { fullName?: string })?.fullName || "System",
        at: h.at ? new Date(h.at).toISOString() : null,
      })),
    },
    checkIns: checkIns.map((c) => ({
      _id: String(c._id),
      method: c.method,
      reached: c.reached,
      outcome: c.outcome || null,
      customOutcome: c.customOutcome || null,
      notes: c.notes || null,
      nextFollowUpAt: c.nextFollowUpAt ? new Date(c.nextFollowUpAt).toISOString() : null,
      previousStatus: c.previousStatus,
      newStatus: c.newStatus,
      userName: (c.user as unknown as { fullName?: string })?.fullName || "Team Member",
      createdAt: new Date(c.createdAt).toISOString(),
    })),
    canLogCheckIn: caller.role === "unit_head" || caller.role === "executive" || String(person.assignedTo?._id || person.assignedTo) === String(caller._id),
    canReassign: caller.role === "unit_head" || caller.role === "executive",
  });
}
