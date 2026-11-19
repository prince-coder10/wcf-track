
import { Suspense } from "react";
import AbsenteesDataLoader from "./components/AbsenteesDataLoader";
import AbsenteesSkeleton from "./components/AbsenteesSkeleton";

export const metadata = {
  title: "Absentee Members | WCF Evangelism & Follow-up",
  description: "Follow-up tracking for fellowship members who missed services",
};

export default function AbsenteesPage({
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
  return (
    <main className="flex-1 px-4 sm:px-6 pt-6 pb-24 md:pb-12 max-w-7xl w-full mx-auto">
      <Suspense fallback={<AbsenteesSkeleton />}>
        <AbsenteesDataLoader searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
