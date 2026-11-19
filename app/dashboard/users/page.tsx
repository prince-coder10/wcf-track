import { Suspense } from "react";
import UsersDataLoader from "./components/UsersDataLoader";
import UsersSkeleton from "./components/UsersSkeleton";

export const metadata = {
  title: "Users & Roles | WCF Evangelism & Follow-up",
  description: "Manage accounts, roles and permissions",
};

/**
 * Users and roles page.
 * Wrapped in <Suspense> so the shell navigation is instant and uncached data
 * streams cleanly without blocking Next.js prerendering.
 */
export default function UsersPage() {
  return (
    <main className="flex-1 px-3.5 sm:px-6 pt-5 sm:pt-6 pb-28 md:pb-8 max-w-6xl w-full mx-auto">
      <Suspense fallback={<UsersSkeleton />}>
        <UsersDataLoader />
      </Suspense>
    </main>
  );
}
