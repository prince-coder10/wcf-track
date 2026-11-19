import { Suspense } from "react";
import PersonDetailDataLoader from "./components/PersonDetailDataLoader";
import PersonDetailSkeleton from "./components/PersonDetailSkeleton";

export const metadata = {
  title: "Person Details | WCF Evangelism & Follow-up",
  description: "View person details, interaction history, and follow-up activities",
};

export default function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="flex-1 px-4 sm:px-6 pt-5 sm:pt-6 pb-24 md:pb-8 max-w-2xl w-full mx-auto">
      <Suspense fallback={<PersonDetailSkeleton />}>
        <PersonDetailDataLoader params={params} />
      </Suspense>
    </main>
  );
}
