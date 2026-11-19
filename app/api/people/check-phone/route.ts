import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import Person, { normalizePhone } from "@/models/Person";
import { roleHasPermission, PERMISSION_ACTIONS } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) {
    return session;
  }

  // Must have people:create or people:read permission
  const canCheck =
    roleHasPermission(session.role, PERMISSION_ACTIONS.PEOPLE_CREATE) ||
    roleHasPermission(session.role, PERMISSION_ACTIONS.PEOPLE_READ_ALL) ||
    roleHasPermission(session.role, PERMISSION_ACTIONS.PEOPLE_READ_OWN);

  if (!canCheck) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rawPhone = searchParams.get("phone")?.trim();

  if (!rawPhone || rawPhone.length < 5) {
    return NextResponse.json({ exists: false });
  }

  const phoneNormalized = normalizePhone(rawPhone);
  if (!phoneNormalized) {
    return NextResponse.json({ exists: false });
  }

  await connectDB();

  const existing = await Person.findOne({ phoneNormalized })
    .populate("assignedTo", "fullName")
    .populate("evangelist", "fullName")
    .select("fullName hall evangelizedAt assignedTo evangelist createdAt")
    .lean();

  if (!existing) {
    return NextResponse.json({ exists: false });
  }

  const assignedToName =
    (existing.assignedTo as { fullName?: string })?.fullName || "Unassigned";
  const evangelistName =
    (existing.evangelist as { fullName?: string })?.fullName || "Unknown";

  return NextResponse.json({
    exists: true,
    person: {
      _id: String(existing._id),
      fullName: existing.fullName,
      hall: existing.hall,
      evangelizedAt: existing.evangelizedAt ? new Date(existing.evangelizedAt).toISOString() : null,
      assignedToName,
      evangelistName,
    },
  });
}
