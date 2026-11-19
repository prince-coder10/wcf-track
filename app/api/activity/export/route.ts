import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { assertActiveUser } from "@/services/people.service";
import ActivityLog, { IActivityLog } from "@/models/ActivityLog";
import { Types } from "mongoose";

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  // Neutralize CSV injection formulas (=, +, -, @)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) {
    return session;
  }

  await connectDB();
  const caller = await assertActiveUser(session.sub);

  if (caller.role !== "unit_head") {
    return NextResponse.json(
      { error: "Access denied. Only unit heads can export activity logs." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const userId = searchParams.get("userId") || undefined;
  const action = searchParams.get("action") || undefined;
  const dateRange = (searchParams.get("dateRange") as "7d" | "30d" | "all") || "7d";

  const query: Record<string, unknown> = {};

  if (userId && Types.ObjectId.isValid(userId)) {
    query.user = new Types.ObjectId(userId);
  }
  if (action && action !== "all") {
    query.action = action;
  }
  if (dateRange && dateRange !== "all") {
    const days = dateRange === "30d" ? 30 : 7;
    query.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
  }
  if (search && search.trim()) {
    const term = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { userName: { $regex: term, $options: "i" } },
      { targetLabel: { $regex: term, $options: "i" } },
      { details: { $regex: term, $options: "i" } },
    ];
  }

  const logs = await ActivityLog.find(query).sort({ createdAt: -1 }).limit(1000).lean();

  const headers = ["Timestamp", "Who", "Role", "Action", "Target", "Details"];
  const rows = logs.map((l: IActivityLog) => [
    escapeCsvField(new Date(l.createdAt).toISOString()),
    escapeCsvField(l.userName),
    escapeCsvField(l.userRole),
    escapeCsvField(l.action),
    escapeCsvField(l.targetLabel),
    escapeCsvField(l.details),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const dateStr = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="wcf-activity-log-${dateStr}.csv"`,
    },
  });
}
