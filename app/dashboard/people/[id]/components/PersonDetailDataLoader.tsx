import { connection } from "next/server";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Person from "@/models/Person";
import CheckIn from "@/models/CheckIn";
import { assertActiveUser } from "@/services/people.service";
import { canUserViewPerson } from "@/services/checkin.service";
import { logPersonViewIfNotRecent, getPersonActivityLogs } from "@/services/activity.service";
import PersonDetailClient from "../PersonDetailClient";
import { Types } from "mongoose";

async function getPersonDetailSnapshot(personId: string, sub: string) {
  const caller = await assertActiveUser(sub);

  const person = await Person.findById(personId)
    .populate("evangelist", "fullName login role")
    .populate("assignedTo", "fullName login role")
    .populate("createdBy", "fullName")
    .populate("assignmentHistory.from", "fullName")
    .populate("assignmentHistory.to", "fullName")
    .populate("assignmentHistory.by", "fullName");

  if (!person) {
    return null;
  }

  if (!canUserViewPerson(caller.role, String(caller._id), person)) {
    return null;
  }

  // Record profile view once per session / 2-hour window
  void logPersonViewIfNotRecent(
    String(caller._id),
    caller.fullName,
    caller.role,
    String(person._id),
    person.fullName
  );

  const checkIns = await CheckIn.find({ person: person._id })
    .sort({ createdAt: -1 })
    .populate("user", "fullName role")
    .lean();

  const nowMs = Date.now();
  let lastContactDays: number | null = null;
  if (person.lastContactAt) {
    const diffMs = nowMs - new Date(person.lastContactAt).getTime();
    lastContactDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  const personData = {
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
  };

  const checkInsData = checkIns.map((c) => ({
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
  }));

  const canLogCheckIn =
    caller.role === "unit_head" ||
    caller.role === "executive" ||
    String(person.assignedTo?._id || person.assignedTo) === String(caller._id);

  const canReassign = caller.role === "unit_head" || caller.role === "executive";

  // Only unit_head has access to the Activity Log / Record activity card
  const activityLogs =
    caller.role === "unit_head"
      ? await getPersonActivityLogs(String(person._id), 6)
      : [];

  return {
    personData,
    checkInsData,
    activityLogs,
    canLogCheckIn,
    canReassign,
    callerRole: caller.role,
  };
}

export default async function PersonDetailDataLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: personId } = await params;
  await connection();
  const session = await getSession();

  if (!session?.sub) {
    redirect(`/login?from=/dashboard/people/${personId}`);
  }

  if (!Types.ObjectId.isValid(personId)) {
    redirect("/dashboard/people");
  }

  await connectDB();

  const snapshot = await getPersonDetailSnapshot(personId, session.sub);
  if (!snapshot) {
    redirect("/dashboard/people");
  }

  return (
    <PersonDetailClient
      person={snapshot.personData}
      checkIns={snapshot.checkInsData}
      activityLogs={snapshot.activityLogs}
      canLogCheckIn={snapshot.canLogCheckIn}
      canReassign={snapshot.canReassign}
      userRole={snapshot.callerRole}
    />
  );
}
