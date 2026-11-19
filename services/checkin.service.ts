import { Types } from "mongoose";
import Person, { IPerson } from "@/models/Person";
import CheckIn, { ICheckIn } from "@/models/CheckIn";
import User from "@/models/User";
import { PersonStatus } from "@/lib/status";
import { Role, roleHasPermission, PERMISSION_ACTIONS } from "@/lib/permissions";
import { logActivity } from "@/services/activity.service";

export interface LogCheckInInput {
  personId: string;
  userId: string;
  userRole: Role;
  method: "whatsapp" | "call" | "visit";
  reached: boolean;
  outcome?: string;
  customOutcome?: string;
  notes?: string;
  nextFollowUpAt?: string;
  newStatus?: PersonStatus;
}

export class CheckInPermissionError extends Error {
  constructor(message = "You do not have permission to log check-ins for this person.") {
    super(message);
    this.name = "CheckInPermissionError";
  }
}

export class PersonNotFoundError extends Error {
  constructor(message = "Person not found.") {
    super(message);
    this.name = "PersonNotFoundError";
  }
}

/**
 * Validates whether a user is allowed to access and view a person's profile.
 */
export function canUserViewPerson(userRole: Role, userId: string, person: IPerson): boolean {
  if (
    roleHasPermission(userRole, PERMISSION_ACTIONS.PEOPLE_READ_ALL) ||
    userRole === "unit_head" ||
    userRole === "executive"
  ) {
    return true;
  }

  // Handle both unpopulated ObjectId/string and populated document object ({ _id: ... })
  const assignedToId = (person.assignedTo as { _id?: unknown })?._id ?? person.assignedTo;
  const evangelistId = (person.evangelist as { _id?: unknown })?._id ?? person.evangelist;
  const createdById = (person.createdBy as { _id?: unknown })?._id ?? person.createdBy;

  if (userRole === "follow_up") {
    return !!assignedToId && String(assignedToId) === String(userId);
  }

  if (userRole === "evangelist") {
    return (
      (!!evangelistId && String(evangelistId) === String(userId)) ||
      (!!createdById && String(createdById) === String(userId))
    );
  }

  return false;
}

/**
 * Validates whether a user is allowed to log a check-in for this person.
 */
export function canUserCheckInPerson(userRole: Role, userId: string, person: IPerson): boolean {
  if (
    roleHasPermission(userRole, PERMISSION_ACTIONS.PEOPLE_ASSIGN) ||
    userRole === "unit_head" ||
    userRole === "executive"
  ) {
    return true;
  }

  const assignedToId = (person.assignedTo as { _id?: unknown })?._id ?? person.assignedTo;

  if (userRole === "follow_up") {
    return !!assignedToId && String(assignedToId) === String(userId);
  }

  return false;
}

/**
 * Creates a check-in record and updates the person's tracking fields.
 */
export async function logCheckIn(input: LogCheckInInput): Promise<ICheckIn> {
  const { personId, userId, userRole, method, reached, outcome, customOutcome, notes, nextFollowUpAt, newStatus } = input;

  if (!Types.ObjectId.isValid(personId)) {
    throw new PersonNotFoundError();
  }

  const person = await Person.findById(personId);
  if (!person) {
    throw new PersonNotFoundError();
  }

  if (!canUserCheckInPerson(userRole, userId, person)) {
    throw new CheckInPermissionError();
  }

  const previousStatus = person.status;
  const targetStatus = newStatus || previousStatus;

  const now = new Date();
  const nextDate = nextFollowUpAt ? new Date(nextFollowUpAt) : undefined;

  // 1. Create the CheckIn document
  const checkIn = new CheckIn({
    person: person._id,
    user: new Types.ObjectId(userId),
    method,
    reached,
    outcome: outcome || undefined,
    customOutcome: customOutcome || undefined,
    notes: notes || undefined,
    nextFollowUpAt: nextDate,
    previousStatus,
    newStatus: targetStatus,
  });

  await checkIn.save();

  // 2. Update the Person document
  person.checkInCount = (person.checkInCount || 0) + 1;
  person.lastAttemptAt = now;
  if (reached) {
    person.lastContactAt = now;
  }
  if (nextDate) {
    person.nextFollowUpAt = nextDate;
  }
  if (targetStatus !== previousStatus) {
    person.status = targetStatus;
    person.statusChangedAt = now;
    if (targetStatus === "integrated" && !person.integratedAt) {
      person.integratedAt = now;
    }
  }

  await person.save();

  // 3. Log Check-In Activity for Audit Trail
  const user = await User.findById(userId).select("fullName");
  const userName = user?.fullName || "Team Member";
  const outcomeLabel = outcome ? outcome.replace(/_/g, " ") : reached ? "reached" : "no answer";
  const nextFollowUpStr = nextDate
    ? `, next follow-up ${nextDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
    : "";
  const details = `${method.charAt(0).toUpperCase() + method.slice(1)}, ${outcomeLabel}${nextFollowUpStr}`;

  void logActivity({
    userId,
    userName,
    userRole,
    action: "check_in",
    targetType: "person",
    targetId: person._id,
    targetLabel: person.fullName,
    details,
    metadata: {
      method,
      reached,
      outcome,
      customOutcome,
      previousStatus,
      newStatus: targetStatus,
    },
  });

  return checkIn;
}
