import { Suspense } from "react";
import PeopleDataLoader from "./components/PeopleDataLoader";
import PeopleSkeleton from "./components/PeopleSkeleton";

export const metadata = {
  title: "People | WCF Evangelism & Follow-up",
  description: "View and manage evangelized people and follow-up assignments",
};

/**
 * People management page.
 * Wrapped in Suspense so the shell navigation is instant and data streams smoothly.
 */
export default function PeoplePage() {
  return (
    <main className="flex-1 px-3.5 sm:px-6 pt-5 sm:pt-6 pb-28 md:pb-8 max-w-6xl w-full mx-auto">
      <Suspense fallback={<PeopleSkeleton />}>
        <PeopleDataLoader />
      </Suspense>
    </main>
  );
}
