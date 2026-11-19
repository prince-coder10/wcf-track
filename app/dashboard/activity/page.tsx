import { Suspense } from "react";
import ActivityDataLoader from "./components/ActivityDataLoader";
import ActivityLogSkeleton from "./components/ActivityLogSkeleton";

export const metadata = {
  title: "Activity Log | WCF Evangelism & Follow-up",
  description: "Audit trail of actions, profile views, check-ins, and assignments",
};

export default function ActivityLogPage({
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
  return (
    <main className="flex-1 px-4 sm:px-6 pt-6 pb-24 md:pb-12 max-w-6xl w-full mx-auto">
      <Suspense fallback={<ActivityLogSkeleton />}>
        <ActivityDataLoader searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
