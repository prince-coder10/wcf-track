import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import { assertActiveUser } from "@/services/people.service";
import {
  logCheckIn,
  CheckInPermissionError,
  PersonNotFoundError,
} from "@/services/checkin.service";
import { CHECKIN_METHODS, PersonStatus, PERSON_STATUSES } from "@/lib/status";
import { z } from "zod";
import { Types } from "mongoose";

const LogCheckInSchema = z.object({
  method: z.enum(CHECKIN_METHODS),
  reached: z.boolean(),
  outcome: z.string().optional(),
  customOutcome: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  nextFollowUpAt: z.string().optional(),
  newStatus: z.enum(PERSON_STATUSES).optional(),
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
    return NextResponse.json({ error: "Invalid person ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = LogCheckInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 422 }
    );
  }

  await connectDB();
  const caller = await assertActiveUser(session.sub);

  try {
    const checkIn = await logCheckIn({
      personId: id,
      userId: String(caller._id),
      userRole: caller.role,
      method: parsed.data.method,
      reached: parsed.data.reached,
      outcome: parsed.data.outcome,
      customOutcome: parsed.data.customOutcome,
      notes: parsed.data.notes,
      nextFollowUpAt: parsed.data.nextFollowUpAt,
      newStatus: parsed.data.newStatus as PersonStatus | undefined,
    });

    return NextResponse.json({
      ok: true,
      checkIn: {
        _id: String(checkIn._id),
      },
    });
  } catch (err: unknown) {
    if (err instanceof PersonNotFoundError) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }
    if (err instanceof CheckInPermissionError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error("Error logging check-in:", err);
    return NextResponse.json(
      { error: "Failed to record check-in" },
      { status: 500 }
    );
  }
}
