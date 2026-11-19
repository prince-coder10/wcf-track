import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";
import {
  getPeopleCsvExport,
  assertActiveUser,
  AuthenticationError,
  ForbiddenError,
} from "@/services/people.service";
import { logActivity } from "@/services/activity.service";

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

    const csvContent = await getPeopleCsvExport(
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
      }
    );

    const lineCount = Math.max(0, csvContent.split("\n").filter(Boolean).length - 1);
    const filterDesc = status || tab || "all";

    void logActivity({
      userId: caller._id,
      userName: caller.fullName,
      userRole: caller.role,
      action: "exported",
      targetType: "export",
      targetLabel: "People list",
      details: `${lineCount} rows, filter: ${filterDesc}`,
      metadata: { rowCount: lineCount, filter: filterDesc },
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="wcf-evangelism-people-${dateStr}.csv"`,
      },
    });
  } catch (err: unknown) {
    if (err instanceof AuthenticationError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error("Error generating CSV export:", err);
    return NextResponse.json(
      { error: "Failed to generate CSV export" },
      { status: 500 }
    );
  }
}
