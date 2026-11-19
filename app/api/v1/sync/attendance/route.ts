import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import FellowshipMember, { WCF_EVENTS, WcfEvent } from "@/models/FellowshipMember";
import { logActivity } from "@/services/activity.service";
import { z } from "zod";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length === 13) {
    return `+${digits}`;
  }
  if (digits.startsWith("0") && digits.length === 11) {
    return `+234${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    return `+234${digits}`;
  }
  return `+${digits}`;
}

const MemberItemSchema = z.object({
  fullName: z.string().min(1, "Full name is required").trim(),
  phone: z.string().min(5, "Valid phone number is required").trim(),
  hostel: z.string().min(1, "Hostel/Hall is required").trim(),
  roomOrBlock: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  newMember: z.boolean().optional().default(false),
  lastCheckInDate: z.string().datetime().or(z.string().min(1)),
});

const AttendanceSyncSchema = z.object({
  event: z.enum(WCF_EVENTS, { message: "Invalid event name" }),
  sessionDate: z.string().datetime().or(z.string().min(1)),
  absentees: z.array(MemberItemSchema).min(1, "At least one absentee member required"),
});

export async function POST(req: NextRequest) {
  // 1. API Key verification
  const providedKey = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");
  const expectedKey = process.env.FELLOWSHIP_SYNC_API_KEY;

  if (!expectedKey || !providedKey || providedKey !== expectedKey) {
    return NextResponse.json(
      { error: "Unauthorized. Invalid or missing API key." },
      { status: 401 }
    );
  }

  // 2. Body Parsing & Validation
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
  }

  const parsed = AttendanceSyncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const { event, sessionDate, absentees } = parsed.data;
  const parsedSessionDate = new Date(sessionDate);

  await connectDB();

  // 3. Bulk Upsert operations by normalized phone
  const bulkOps = absentees.map((item) => {
    const phoneNormalized = normalizePhone(item.phone);
    const parsedLastCheckIn = new Date(item.lastCheckInDate);

    return {
      updateOne: {
        filter: { phoneNormalized },
        update: {
          $set: {
            fullName: item.fullName,
            phone: item.phone,
            phoneNormalized,
            hostel: item.hostel,
            roomOrBlock: item.roomOrBlock || null,
            unit: item.unit || null,
            newMember: !!item.newMember,
            sessionDate: parsedSessionDate,
            event: event as WcfEvent,
            lastCheckInDate: parsedLastCheckIn,
            status: "pending", // Reset to pending for active follow-up
            statusChangedAt: new Date(),
          },
        },
        upsert: true,
      },
    };
  });

  const result = await FellowshipMember.bulkWrite(bulkOps);

  // 4. Log system activity for Unit Head visibility
  void logActivity({
    userId: "000000000000000000000000",
    userName: "Attendance App Sync",
    userRole: "unit_head",
    action: "created",
    targetType: "system",
    targetLabel: "Absentee Members Sync",
    details: `${event.replace(/_/g, " ")}: ${absentees.length} absentee(s) synced (${result.upsertedCount} new, ${result.modifiedCount} updated)`,
    metadata: {
      event,
      sessionDate: parsedSessionDate.toISOString(),
      absenteeCount: absentees.length,
      upsertedCount: result.upsertedCount,
      modifiedCount: result.modifiedCount,
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Attendance sync successful",
    event,
    sessionDate: parsedSessionDate.toISOString(),
    processed: absentees.length,
    newMembersAdded: result.upsertedCount,
    membersUpdated: result.modifiedCount,
  });
}
