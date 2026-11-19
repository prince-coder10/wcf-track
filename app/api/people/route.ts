import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import Person from "@/models/Person";
import {
  getPeopleData,
  assertActiveUser,
  AuthenticationError,
  ForbiddenError,
} from "@/services/people.service";
import { roleHasPermission, PERMISSION_ACTIONS } from "@/lib/permissions";
import { RESPONSES, CONTACT_METHODS } from "@/lib/status";
import { logActivity } from "@/services/activity.service";
import { z } from "zod";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) {
    return session;
  }

  await connectDB();

  try {
    const caller = await assertActiveUser(session.sub);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const tab = searchParams.get("tab");
    const status = searchParams.get("status");
    const hall = searchParams.get("hall");
    const evangelist = searchParams.get("evangelist");
    const assignedTo = searchParams.get("assignedTo");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const data = await getPeopleData(
      {
        userId: String(caller._id),
        role: caller.role,
      },
      {
        search,
        tab,
        status,
        hall,
        evangelist,
        assignedTo,
        page,
        limit,
      }
    );

    return NextResponse.json(data);
  } catch (err: unknown) {
    if (err instanceof AuthenticationError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error("Error in GET /api/people:", err);
    return NextResponse.json(
      { error: "Failed to fetch people" },
      { status: 500 }
    );
  }
}

const CreatePersonSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  phone: z.string().trim().min(7, "Phone number is required"),
  hall: z.string().trim().min(2, "Hall of residence is required"),
  evangelizedAt: z.string().optional(),
  response: z.enum(RESPONSES, {
    message: "Please select their spiritual response",
  }),
  evangelistId: z.string().optional(), // Allowed for unit_head / executive to attribute to another evangelist
  roomOrLocation: z.string().trim().optional(),
  level: z.string().trim().optional(),
  course: z.string().trim().optional(),
  preferredContact: z.enum(CONTACT_METHODS).optional(),
  currentChurch: z.string().trim().optional(),
  prayerRequest: z.string().trim().optional(),
  handoffNote: z.string().trim().optional(),
  consentConfirmed: z.boolean().refine((val) => val === true, {
    message: "Consent to be contacted is required",
  }),
});

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) {
    return session;
  }

  const canCreate = roleHasPermission(session.role, PERMISSION_ACTIONS.PEOPLE_CREATE);
  if (!canCreate) {
    return NextResponse.json(
      { error: "You do not have permission to add new people" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreatePersonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 422 }
    );
  }

  await connectDB();

  const caller = await assertActiveUser(session.sub);
  const data = parsed.data;

  // Determine attribution for evangelist:
  // - If role is 'evangelist', it MUST be caller._id
  // - If unit_head or executive, they can optionally specify another evangelist
  let evangelistId = caller._id;
  if (
    (caller.role === "unit_head" || caller.role === "executive") &&
    data.evangelistId &&
    Types.ObjectId.isValid(data.evangelistId)
  ) {
    evangelistId = new Types.ObjectId(data.evangelistId);
  }

  const evangelizedDate = data.evangelizedAt
    ? new Date(data.evangelizedAt)
    : new Date();

  const newPerson = new Person({
    fullName: data.fullName,
    phone: data.phone,
    hall: data.hall,
    evangelizedAt: evangelizedDate,
    evangelist: evangelistId,
    response: data.response,
    roomOrLocation: data.roomOrLocation || undefined,
    level: data.level || undefined,
    course: data.course || undefined,
    preferredContact: data.preferredContact || undefined,
    currentChurch: data.currentChurch || undefined,
    prayerRequest: data.prayerRequest || undefined,
    handoffNote: data.handoffNote || undefined,
    consentConfirmed: true,
    consentAt: new Date(),
    status: "new",
    createdBy: caller._id,
  });

  await newPerson.save();

  void logActivity({
    userId: caller._id,
    userName: caller.fullName,
    userRole: caller.role,
    action: "created",
    targetType: "person",
    targetId: newPerson._id,
    targetLabel: newPerson.fullName,
    details: "New record",
    metadata: {
      hall: newPerson.hall,
      response: newPerson.response,
    },
  });

  return NextResponse.json({
    ok: true,
    person: {
      _id: String(newPerson._id),
      fullName: newPerson.fullName,
    },
  });
}
