import { connection } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import UsersClient, { UserItem } from "../UsersClient";

/**
 * Async data loader for the Users & Roles route.
 * Lives inside a <Suspense> boundary in page.tsx so Next.js streams the page
 * without blocking prerendering or throwing connection() outside Suspense errors.
 */
export default async function UsersDataLoader() {
  await connection();
  const session = await getSession();

  await connectDB();
  const rawUsers = await User.find({})
    .select(
      "fullName login phone unit role status lastLoginAt createdAt permissions invite"
    )
    .sort({ createdAt: -1 })
    .lean();

  const users: UserItem[] = rawUsers.map((u) => ({
    id: String(u._id),
    fullName: u.fullName,
    login: u.login,
    phone: u.phone || "",
    unit: u.unit || "Follow-up",
    role: u.role,
    status: u.status,
    permissions: u.permissions || { canManageUsers: false },
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt ? u.createdAt.toISOString() : null,
    hasPendingInvite:
      u.status === "invited" &&
      !!u.invite?.expiresAt &&
      new Date(u.invite.expiresAt) > new Date(),
  }));

  return (
    <UsersClient
      initialUsers={users}
      currentUserId={session?.sub}
      currentUserRole={session?.role}
    />
  );
}
