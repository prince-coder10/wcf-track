import { Suspense } from "react";
import DashboardDataLoader from "./components/DashboardDataLoader";
import DashboardSkeleton from "./components/DashboardSkeleton";

export const metadata = {
  title: "Dashboard | WCF Evangelism & Follow-up",
  description: "Overview and follow-up metrics",
};

export default function DashboardPage() {
  return (
    <main className="flex-1 px-4 pt-6 pb-24 md:pb-8 md:px-7 max-w-5xl w-full mx-auto">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardDataLoader />
      </Suspense>
    </main>
  );
}
