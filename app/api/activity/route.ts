import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { assertActiveUser } from "@/services/people.service";
import { getActivityLogs } from "@/services/activity.service";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) {
    return session;
  }

  await connectDB();
  const caller = await assertActiveUser(session.sub);

  // Strictly restricted to unit_head
  if (caller.role !== "unit_head") {
    return NextResponse.json(
      { error: "Access denied. Only unit heads can access the activity log." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const userId = searchParams.get("userId") || undefined;
  const action = searchParams.get("action") || undefined;
  const dateRange = (searchParams.get("dateRange") as "7d" | "30d" | "all") || "7d";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "25", 10);

  const result = await getActivityLogs({
    search,
    userId,
    action,
    dateRange,
    page,
    limit,
  });

  return NextResponse.json(result);
}
