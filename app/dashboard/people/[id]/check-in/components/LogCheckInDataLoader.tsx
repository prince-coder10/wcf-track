import { connection } from "next/server";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Person from "@/models/Person";
import { assertActiveUser } from "@/services/people.service";
import { canUserCheckInPerson } from "@/services/checkin.service";
import LogCheckInClient from "../LogCheckInClient";
import { Types } from "mongoose";

export default async function LogCheckInDataLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: personId } = await params;
  await connection();
  const session = await getSession();

  if (!session?.sub) {
    redirect(`/login?from=/dashboard/people/${personId}/check-in`);
  }

  if (!Types.ObjectId.isValid(personId)) {
    redirect("/dashboard/people");
  }

  await connectDB();
  const caller = await assertActiveUser(session.sub);

  const person = await Person.findById(personId).select(
    "fullName hall phone status checkInCount assignedTo"
  );

  if (!person) {
    redirect("/dashboard/people");
  }

  if (!canUserCheckInPerson(caller.role, String(caller._id), person)) {
    redirect(`/dashboard/people/${personId}`);
  }

  const personData = {
    _id: String(person._id),
    fullName: person.fullName,
    hall: person.hall,
    phone: person.phone,
    status: person.status,
    checkInCount: person.checkInCount || 0,
  };

  return <LogCheckInClient person={personData} />;
}
