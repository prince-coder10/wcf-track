import { Types } from "mongoose";
import ActivityLog, { ActivityAction, ActivityTargetType, IActivityLog } from "@/models/ActivityLog";
import { Role } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";

export interface LogActivityInput {
  userId: string | Types.ObjectId;
  userName: string;
  userRole: Role;
  action: ActivityAction;
  targetType: ActivityTargetType;
  targetId?: string | Types.ObjectId | null;
  targetLabel: string;
  details: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityFilterParams {
  search?: string;
  userId?: string;
  action?: string;
  dateRange?: "7d" | "30d" | "all";
  page?: number;
  limit?: number;
}

/**
 * Appends an activity log asynchronously. Safe against uncaught errors so it never breaks caller requests.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await connectDB();
    await ActivityLog.create({
      user: new Types.ObjectId(String(input.userId)),
      userName: input.userName,
      userRole: input.userRole,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ? new Types.ObjectId(String(input.targetId)) : null,
      targetLabel: input.targetLabel,
      details: input.details,
      metadata: input.metadata || null,
      createdAt: new Date(),
    });
  } catch (err) {
    // Audit logs should fail gracefully without disrupting core flows
    console.error("Failed to write activity log:", err);
  }
}

/**
 * Records a person profile view if the same user has not viewed this person within the last 2 hours.
 */
export async function logPersonViewIfNotRecent(
  userId: string,
  userName: string,
  userRole: Role,
  personId: string,
  personName: string
): Promise<void> {
  try {
    await connectDB();
    const twoHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const existing = await ActivityLog.findOne({
      user: new Types.ObjectId(userId),
      action: "viewed",
      targetId: new Types.ObjectId(personId),
      createdAt: { $gte: twoHoursAgo },
    }).select("_id");

    if (!existing) {
      await logActivity({
        userId,
        userName,
        userRole,
        action: "viewed",
        targetType: "person",
        targetId: personId,
        targetLabel: personName,
        details: "Opened profile",
      });
    }
  } catch (err) {
    console.error("Failed to check or log person view:", err);
  }
}

/**
 * Retrieves the activity trail for a single person (for the Record activity card).
 */
export async function getPersonActivityLogs(personId: string, limit = 5): Promise<Array<{
  action: ActivityAction;
  userName: string;
  userRole: Role;
  details: string;
  createdAt: string;
}>> {
  try {
    await connectDB();
    const logs = await ActivityLog.find({
      targetId: new Types.ObjectId(personId),
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return logs.map((log: IActivityLog) => ({
      action: log.action,
      userName: log.userName,
      userRole: log.userRole,
      details: log.details,
      createdAt: new Date(log.createdAt).toISOString(),
    }));
  } catch (err) {
    console.error("Failed to fetch person activity logs:", err);
    return [];
  }
}

/**
 * Retrieves paginated activity logs for the admin Activity Log page.
 */
export async function getActivityLogs(params: ActivityFilterParams) {
  await connectDB();

  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 25));
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};

  if (params.userId && Types.ObjectId.isValid(params.userId)) {
    query.user = new Types.ObjectId(params.userId);
  }

  if (params.action && params.action !== "all") {
    query.action = params.action;
  }

  if (params.dateRange && params.dateRange !== "all") {
    const days = params.dateRange === "30d" ? 30 : 7;
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    query.createdAt = { $gte: sinceDate };
  }

  if (params.search && params.search.trim()) {
    const term = params.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { userName: { $regex: term, $options: "i" } },
      { targetLabel: { $regex: term, $options: "i" } },
      { details: { $regex: term, $options: "i" } },
    ];
  }

  const [logs, total] = await Promise.all([
    ActivityLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ActivityLog.countDocuments(query),
  ]);

  return {
    logs: logs.map((l: IActivityLog) => ({
      _id: String(l._id),
      userName: l.userName,
      userRole: l.userRole,
      action: l.action,
      targetType: l.targetType,
      targetId: l.targetId ? String(l.targetId) : null,
      targetLabel: l.targetLabel,
      details: l.details,
      createdAt: new Date(l.createdAt).toISOString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
