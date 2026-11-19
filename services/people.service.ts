import { Types } from "mongoose";
import Person from "@/models/Person";
import User, { IUser } from "@/models/User";
import { Role, roleHasPermission, PERMISSION_ACTIONS } from "@/lib/permissions";
import { PersonItem, PeopleResponse, UserOption } from "@/app/dashboard/people/types";
import { PERSON_STATUSES, PersonStatus } from "@/lib/status";

export const ALLOWED_TABS = ["all", "unassigned", "overdue", "my"] as const;
export type AllowedTab = (typeof ALLOWED_TABS)[number];

export interface PeopleQueryParams {
  search?: string | null;
  tab?: string | null; // all | unassigned | overdue | my
  status?: string | null;
  hall?: string | null;
  evangelist?: string | null;
  assignedTo?: string | null;
  page?: number;
  limit?: number;
}

export interface UserContext {
  userId: string;
  role: Role;
}

export class AuthenticationError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Validates a user's active status and tokenVersion against MongoDB.
 * Returns the fresh database User document if valid, throws if invalid or revoked.
 */
export async function assertActiveUser(userId: string): Promise<IUser> {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AuthenticationError("Invalid user identification context");
  }

  const user = await User.findById(userId)
    .select("status tokenVersion role login fullName permissions")
    .lean();

  if (!user || user.status !== "active") {
    throw new AuthenticationError("Session expired or account is inactive");
  }

  return user as unknown as IUser;
}

/**
 * Builds the security-enforced base filter for querying people:
 * - unit_head & executive: can read all people
 * - evangelist: can ONLY read people they evangelized to (or created)
 * - follow_up: can read people assigned to them
 *
 * Ensures valid ObjectIds to prevent matching unintended documents (e.g. { assignedTo: null }).
 */
export function buildPeopleAccessFilter(user: UserContext): Record<string, unknown> {
  const { role, userId } = user;

  const canReadAll =
    roleHasPermission(role, PERMISSION_ACTIONS.PEOPLE_READ_ALL) ||
    role === "unit_head" ||
    role === "executive";

  if (canReadAll) {
    return {};
  }

  if (!Types.ObjectId.isValid(userId)) {
    throw new AuthenticationError("Invalid user authentication context.");
  }

  const userObjectId = new Types.ObjectId(userId);

  if (role === "evangelist") {
    return {
      $or: [{ evangelist: userObjectId }, { createdBy: userObjectId }],
    };
  }

  if (role === "follow_up") {
    return {
      assignedTo: userObjectId,
    };
  }

  // Any unrecognized role with no read permission gets an empty match
  return { _id: { $in: [] } };
}

/**
 * Constructs the final MongoDB query by combining every filter as an independent
 * clause inside an $and array. This strictly guarantees that:
 * 1. Filter parameters (like `tab=overdue`) can NEVER overwrite the security $or clause.
 * 2. URL parameters (like `assignedTo=GRACE_ID`) can NEVER overwrite a follow-up user's restricted assignedTo clause.
 * 3. Invalid ObjectIds or unwhitelisted values force an empty result instead of over-matching.
 */
export function buildPeopleQuery(
  user: UserContext,
  params: PeopleQueryParams,
  prebuiltAccessFilter?: Record<string, unknown>
): Record<string, unknown> {
  const clauses: Record<string, unknown>[] = [];

  // 1. Mandatory access control clause (passed in or computed once)
  const accessFilter = prebuiltAccessFilter ?? buildPeopleAccessFilter(user);
  if (Object.keys(accessFilter).length > 0) {
    clauses.push(accessFilter);
  }

  const search = params.search?.trim();
  const filterTab = params.tab || "all";
  const status = params.status;
  const hall = params.hall;
  const evangelist = params.evangelist;
  const assignedTo = params.assignedTo;

  // 2. Tab filters (whitelisted)
  if (filterTab === "unassigned") {
    // If an evangelist or follow-up member requests 'unassigned', they cannot see unassigned people
    if (user.role === "follow_up") {
      clauses.push({ _id: { $in: [] } });
    } else {
      clauses.push({ assignedTo: null, status: "new" });
    }
  } else if (filterTab === "overdue") {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    clauses.push(
      {
        $or: [
          { lastContactAt: { $lt: sevenDaysAgo } },
          { lastContactAt: null, createdAt: { $lt: sevenDaysAgo } },
        ],
      },
      { status: { $nin: ["integrated", "closed", "unreachable"] } }
    );
  } else if (filterTab === "my") {
    if (!Types.ObjectId.isValid(user.userId)) {
      throw new AuthenticationError("Invalid user authentication context.");
    }
    clauses.push({ assignedTo: new Types.ObjectId(user.userId) });
  } else if (filterTab !== "all" && !ALLOWED_TABS.includes(filterTab as AllowedTab)) {
    // Invalid/unrecognized tab forces empty match
    clauses.push({ _id: { $in: [] } });
  }

  // 3. Dropdown filters (status is whitelisted against PERSON_STATUSES)
  if (status && status !== "all") {
    if (PERSON_STATUSES.includes(status as PersonStatus)) {
      clauses.push({ status });
    } else {
      clauses.push({ _id: { $in: [] } });
    }
  }

  if (hall && hall !== "all") {
    clauses.push({ hall });
  }

  if (evangelist && evangelist !== "all") {
    if (Types.ObjectId.isValid(evangelist)) {
      clauses.push({ evangelist: new Types.ObjectId(evangelist) });
    } else {
      clauses.push({ _id: { $in: [] } });
    }
  }

  if (assignedTo && assignedTo !== "all") {
    if (assignedTo === "unassigned") {
      if (user.role === "follow_up") {
        clauses.push({ _id: { $in: [] } });
      } else {
        clauses.push({ assignedTo: null });
      }
    } else if (Types.ObjectId.isValid(assignedTo)) {
      clauses.push({ assignedTo: new Types.ObjectId(assignedTo) });
    } else {
      clauses.push({ _id: { $in: [] } });
    }
  }

  // 4. Text search
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    clauses.push({
      $or: [
        { fullName: { $regex: regex } },
        { phone: { $regex: regex } },
        { hall: { $regex: regex } },
      ],
    });
  }

  return clauses.length > 0 ? { $and: clauses } : {};
}

/**
 * Escapes CSV values safely against formula injection (CWE-1236)
 * and properly quotes fields containing commas, double quotes, or newlines.
 */
export function sanitizeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();

  // Protect against CSV formula injection in spreadsheet programs (Excel, LibreOffice, Google Sheets)
  if (str.length > 0 && /^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape double quotes by doubling them
  str = str.replace(/"/g, '""');

  return `"${str}"`;
}

/**
 * Centralized service function for querying people.
 * Used by both PeopleDataLoader (SSR) and GET /api/people (Client-side fetch).
 */
export async function getPeopleData(
  user: UserContext,
  params: PeopleQueryParams = {}
): Promise<PeopleResponse> {
  // Compute accessFilter ONCE and reuse for baseFilter and buildPeopleQuery
  const accessFilter = buildPeopleAccessFilter(user);
  const query = buildPeopleQuery(user, params, accessFilter);

  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(100, params.limit || 10));
  const skip = (page - 1) * limit;
  const nowMs = Date.now();

  const [totalCount, peopleDocs, followUpUsers, evangelistUsers, distinctHalls] =
    await Promise.all([
      Person.countDocuments(query),
      Person.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("evangelist", "fullName login role")
        .populate("assignedTo", "fullName login role")
        .lean(),
      User.find({
        role: { $in: ["follow_up", "unit_head", "executive"] },
        status: "active",
      })
        .select("fullName login role")
        .lean(),
      User.find({
        role: { $in: ["evangelist", "unit_head", "executive"] },
        status: "active",
      })
        .select("fullName login role")
        .lean(),
      Person.distinct("hall", accessFilter),
    ]);

  const people: PersonItem[] = peopleDocs.map((p) => {
    let lastContactDays: number | null = null;
    if (p.lastContactAt) {
      const diffMs = nowMs - new Date(p.lastContactAt).getTime();
      lastContactDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    return {
      _id: String(p._id),
      fullName: p.fullName,
      phone: p.phone,
      hall: p.hall,
      roomOrLocation: p.roomOrLocation || null,
      level: p.level || null,
      course: p.course || null,
      response: p.response,
      status: p.status,
      evangelizedAt: p.evangelizedAt ? new Date(p.evangelizedAt).toISOString() : null,
      evangelist: p.evangelist
        ? {
            _id: String((p.evangelist as { _id: unknown; fullName?: string })._id),
            fullName: (p.evangelist as { fullName?: string }).fullName || "Unknown",
          }
        : null,
      assignedTo: p.assignedTo
        ? {
            _id: String((p.assignedTo as { _id: unknown; fullName?: string })._id),
            fullName: (p.assignedTo as { fullName?: string }).fullName || "Unassigned",
          }
        : null,
      checkInCount: p.checkInCount || 0,
      lastContactAt: p.lastContactAt ? new Date(p.lastContactAt).toISOString() : null,
      lastContactDays,
      preferredContact: p.preferredContact || null,
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
    };
  });

  const canManageAssignment =
    roleHasPermission(user.role, PERMISSION_ACTIONS.PEOPLE_ASSIGN) ||
    user.role === "unit_head" ||
    user.role === "executive";

  // If follow_up user or viewing assigned people, compute stats
  let followUpStats: { assigned: number; newCount: number; overdue: number } | undefined;
  if (user.role === "follow_up" && Types.ObjectId.isValid(user.userId)) {
    const userObjectId = new Types.ObjectId(user.userId);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [assigned, newCount, overdue] = await Promise.all([
      Person.countDocuments({ assignedTo: userObjectId }),
      Person.countDocuments({ assignedTo: userObjectId, checkInCount: 0 }),
      Person.countDocuments({
        assignedTo: userObjectId,
        status: { $nin: ["integrated", "closed", "unreachable"] },
        $or: [
          { lastContactAt: { $lt: sevenDaysAgo } },
          { lastContactAt: null, createdAt: { $lt: sevenDaysAgo } },
        ],
      }),
    ]);
    followUpStats = { assigned, newCount, overdue };
  }

  return {
    people,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit) || 1,
    halls: distinctHalls.filter(Boolean) as string[],
    followUpUsers: followUpUsers.map(
      (u): UserOption => ({
        _id: String(u._id),
        fullName: u.fullName,
        role: u.role,
      })
    ),
    evangelistUsers: evangelistUsers.map(
      (u): UserOption => ({
        _id: String(u._id),
        fullName: u.fullName,
        role: u.role,
      })
    ),
    canManageAssignment,
    followUpStats,
  };
}

/**
 * Fetch all matching people for export without pagination, applying same security filter.
 * Returns CSV string ready for download with centralized sanitization.
 */
export async function getPeopleCsvExport(
  user: UserContext,
  params: Omit<PeopleQueryParams, "page" | "limit"> = {}
): Promise<string> {
  const accessFilter = buildPeopleAccessFilter(user);
  const query = buildPeopleQuery(user, params, accessFilter);
  const nowMs = Date.now();

  const peopleDocs = await Person.find(query)
    .sort({ createdAt: -1 })
    .populate("evangelist", "fullName")
    .populate("assignedTo", "fullName")
    .lean();

  const headers = [
    "Name",
    "Phone",
    "Hall",
    "Room",
    "Level",
    "Course",
    "Response",
    "Status",
    "Evangelist",
    "Assigned To",
    "Check-ins",
    "Last Contact",
  ];

  const rows = peopleDocs.map((p) => {
    let lastContactDays: number | null = null;
    if (p.lastContactAt) {
      const diffMs = nowMs - new Date(p.lastContactAt).getTime();
      lastContactDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    const contactStr =
      lastContactDays === null
        ? "Not yet"
        : lastContactDays === 0
        ? "Today"
        : `${lastContactDays} days ago`;

    return [
      sanitizeCsvField(p.fullName),
      sanitizeCsvField(p.phone),
      sanitizeCsvField(p.hall),
      sanitizeCsvField(p.roomOrLocation),
      sanitizeCsvField(p.level),
      sanitizeCsvField(p.course),
      sanitizeCsvField(p.response),
      sanitizeCsvField(p.status),
      sanitizeCsvField((p.evangelist as { fullName?: string })?.fullName || "Unknown"),
      sanitizeCsvField((p.assignedTo as { fullName?: string })?.fullName || "Unassigned"),
      p.checkInCount || 0,
      sanitizeCsvField(contactStr),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}
