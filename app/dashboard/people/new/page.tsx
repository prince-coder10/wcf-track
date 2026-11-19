import { Suspense } from "react";
import AddPersonDataLoader from "./components/AddPersonDataLoader";
import AddPersonSkeleton from "./components/AddPersonSkeleton";

export const metadata = {
  title: "Add Person | WCF Evangelism & Follow-up",
  description: "Record new evangelism outreach contact",
};

export default function AddPersonPage() {
  return (
    <main className="flex-1 px-4 sm:px-6 pt-5 sm:pt-6 pb-24 md:pb-8 max-w-4xl w-full mx-auto">
      <Suspense fallback={<AddPersonSkeleton />}>
        <AddPersonDataLoader />
      </Suspense>
    </main>
  );
}
