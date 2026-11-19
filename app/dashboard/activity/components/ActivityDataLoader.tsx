import { connection } from "next/server";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { assertActiveUser } from "@/services/people.service";
import { getActivityLogs } from "@/services/activity.service";
import User from "@/models/User";
import ActivityLogClient from "../ActivityLogClient";

export default async function ActivityDataLoader({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    userId?: string;
    action?: string;
    dateRange?: "7d" | "30d" | "all";
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  await connection();
  const session = await getSession();

  if (!session?.sub) {
    redirect("/login?from=/dashboard/activity");
  }

  await connectDB();
  const caller = await assertActiveUser(session.sub);

  // Strict Unit Head check
  if (caller.role !== "unit_head") {
    redirect("/dashboard");
  }

  const search = sp.search || "";
  const userId = sp.userId || "";
  const action = sp.action || "";
  const dateRange = sp.dateRange || "7d";
  const page = parseInt(sp.page || "1", 10);

  const [activityData, allUsers] = await Promise.all([
    getActivityLogs({
      search,
      userId,
      action,
      dateRange,
      page,
      limit: 25,
    }),
    User.find({ status: { $ne: "deactivated" } })
      .select("fullName role login")
      .sort({ fullName: 1 })
      .lean(),
  ]);

  return (
    <ActivityLogClient
      initialData={activityData}
      users={allUsers.map((u) => ({
        _id: String(u._id),
        fullName: u.fullName,
        role: u.role,
      }))}
      currentFilters={{
        search,
        userId,
        action,
        dateRange,
        page,
      }}
    />
  );
}
