import { connection } from "next/server";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { roleHasPermission, PERMISSION_ACTIONS } from "@/lib/permissions";
import AddPersonClient from "../AddPersonClient";

export default async function AddPersonDataLoader() {
  await connection();
  const session = await getSession();

  if (!session?.sub) {
    redirect("/login?from=/dashboard/people/new");
  }

  // Permission guard: only roles with people:create can view this form
  const canCreate = roleHasPermission(session.role, PERMISSION_ACTIONS.PEOPLE_CREATE);
  if (!canCreate) {
    redirect("/dashboard/people");
  }

  await connectDB();

  // If unit_head or executive, fetch active evangelists for attribution dropdown
  let evangelistUsers: { _id: string; fullName: string; role: string }[] = [];
  if (session.role === "unit_head" || session.role === "executive") {
    const users = await User.find({
      role: { $in: ["evangelist", "unit_head", "executive"] },
      status: "active",
    })
      .select("fullName role")
      .lean();

    evangelistUsers = users.map((u) => ({
      _id: String(u._id),
      fullName: u.fullName,
      role: u.role,
    }));
  }

  return (
    <AddPersonClient
      userRole={session.role}
      userId={session.sub}
      evangelistUsers={evangelistUsers}
    />
  );
}
