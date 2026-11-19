import { Types } from "mongoose";
import FellowshipMember, { IFellowshipMember, AbsenteeStatus } from "@/models/FellowshipMember";
import { Role } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";

export interface AbsenteeFilterParams {
  search?: string;
  event?: string;
  status?: string;
  newMemberOnly?: boolean;
  page?: number;
  limit?: number;
}

export function canUserViewAbsentee(userRole: Role, userId: string, member: IFellowshipMember): boolean {
  if (userRole === "unit_head" || userRole === "executive") {
    return true;
  }
  if (userRole === "follow_up") {
    const assignedId = (member.assignedTo as { _id?: unknown })?._id ?? member.assignedTo;
    return !!assignedId && String(assignedId) === String(userId);
  }
  return false;
}

export async function getAbsenteeMembersData(
  user: { userId: string; role: Role },
  params: AbsenteeFilterParams
) {
  await connectDB();

  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};

  // Role filtering: follow_up only sees assigned
  if (user.role === "follow_up") {
    query.assignedTo = new Types.ObjectId(user.userId);
  }

  if (params.event && params.event !== "all") {
    query.event = params.event;
  }

  if (params.status && params.status !== "all") {
    query.status = params.status;
  }

  if (params.newMemberOnly) {
    query.newMember = true;
  }

  if (params.search && params.search.trim()) {
    const term = params.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { fullName: { $regex: term, $options: "i" } },
      { phone: { $regex: term, $options: "i" } },
      { hostel: { $regex: term, $options: "i" } },
      { unit: { $regex: term, $options: "i" } },
    ];
  }

  const [members, total] = await Promise.all([
    FellowshipMember.find(query)
      .sort({ sessionDate: -1, lastCheckInDate: 1 })
      .skip(skip)
      .limit(limit)
      .populate("assignedTo", "fullName login")
      .lean(),
    FellowshipMember.countDocuments(query),
  ]);

  const nowMs = Date.now();

  const formatted = members.map((m) => {
    let daysSinceLastAttended: number | null = null;
    if (m.lastCheckInDate) {
      const diffMs = nowMs - new Date(m.lastCheckInDate).getTime();
      daysSinceLastAttended = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    const assigned = m.assignedTo as unknown as { _id: Types.ObjectId; fullName: string } | null;

    return {
      _id: String(m._id),
      fullName: m.fullName,
      phone: m.phone,
      phoneNormalized: m.phoneNormalized,
      hostel: m.hostel,
      roomOrBlock: m.roomOrBlock || null,
      unit: m.unit || null,
      newMember: !!m.newMember,
      event: m.event,
      sessionDate: new Date(m.sessionDate).toISOString(),
      lastCheckInDate: new Date(m.lastCheckInDate).toISOString(),
      daysSinceLastAttended,
      assignedTo: assigned
        ? {
            _id: String(assigned._id),
            fullName: assigned.fullName,
          }
        : null,
      status: m.status as AbsenteeStatus,
      checkInCount: m.checkInCount || 0,
      lastContactAt: m.lastContactAt ? new Date(m.lastContactAt).toISOString() : null,
      notes: m.notes || null,
    };
  });

  return {
    members: formatted,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
