import { Suspense } from "react";
import LogCheckInDataLoader from "./components/LogCheckInDataLoader";
import LogCheckInSkeleton from "./components/LogCheckInSkeleton";


export const metadata = {
  title: "Log Check-in | WCF Evangelism & Follow-up",
  description: "Record follow-up outreach contact and update status",
};

export default function LogCheckInPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="flex-1 px-4 sm:px-6 pt-5 sm:pt-6 pb-24 md:pb-8 max-w-xl w-full mx-auto">
      <Suspense fallback={<LogCheckInSkeleton />}>
        <LogCheckInDataLoader params={params} />
      </Suspense>
    </main>
  );
}
