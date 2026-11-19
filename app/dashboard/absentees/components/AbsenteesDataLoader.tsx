import { connection } from "next/server";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { assertActiveUser } from "@/services/people.service";
import { getAbsenteeMembersData } from "@/services/absentee.service";
import User from "@/models/User";
import AbsenteesClient from "../AbsenteesClient";

export default async function AbsenteesDataLoader({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    event?: string;
    status?: string;
    newMemberOnly?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  await connection();
  const session = await getSession();

  if (!session?.sub) {
    redirect("/login?from=/dashboard/absentees");
  }

  await connectDB();
  const caller = await assertActiveUser(session.sub);

  // Accessible to unit_head, executive, and follow_up
  if (
    caller.role !== "unit_head" &&
    caller.role !== "executive" &&
    caller.role !== "follow_up"
  ) {
    redirect("/dashboard");
  }

  const search = sp.search || "";
  const event = sp.event || "";
  const status = sp.status || "";
  const newMemberOnly = sp.newMemberOnly === "true";
  const page = parseInt(sp.page || "1", 10);

  const canManageAssignment = caller.role === "unit_head" || caller.role === "executive";

  const [absenteesData, followUpUsers] = await Promise.all([
    getAbsenteeMembersData(
      { userId: String(caller._id), role: caller.role },
      { search, event, status, newMemberOnly, page, limit: 24 }
    ),
    canManageAssignment
      ? User.find({ role: "follow_up", status: "active" })
          .select("fullName")
          .sort({ fullName: 1 })
          .lean()
      : Promise.resolve([]),
  ]);

  return (
    <AbsenteesClient
      initialData={absenteesData}
      followUpUsers={followUpUsers.map((u) => ({
        _id: String(u._id),
        fullName: u.fullName,
      }))}
      canManageAssignment={canManageAssignment}
      userRole={caller.role}
      currentFilters={{
        search,
        event,
        status,
        newMemberOnly,
        page,
      }}
    />
  );
}
