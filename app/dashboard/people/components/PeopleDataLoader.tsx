import { connection } from "next/server";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import {
  getPeopleData,
  assertActiveUser,
  AuthenticationError,
} from "@/services/people.service";
import PeopleClient from "../PeopleClient";
import { PeopleResponse } from "../types";
import { Role } from "@/lib/permissions";

async function loadInitialPeopleData(sub: string): Promise<{ data: PeopleResponse; role: Role }> {
  try {
    const liveUser = await assertActiveUser(sub);

    const initialData = await getPeopleData(
      { userId: String(liveUser._id), role: liveUser.role },
      { page: 1, limit: 10 }
    );

    return { data: initialData, role: liveUser.role };
  } catch (err: unknown) {
    if (err instanceof AuthenticationError) {
      redirect("/login?from=/dashboard/people");
    }
    throw err;
  }
}

export default async function PeopleDataLoader() {
  await connection();
  const session = await getSession();

  if (!session?.sub) {
    redirect("/login?from=/dashboard/people");
  }

  await connectDB();

  const { data, role } = await loadInitialPeopleData(session.sub);

  return <PeopleClient initialData={data} userRole={role} />;
}
