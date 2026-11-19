import { connection } from "next/server";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import MobileHeader from "./MobileHeader";

/**
 * Async server component that:
 * 1. Calls connection() to opt out of prerendering
 * 2. Reads & verifies the session cookie
 * 3. Renders the shell (sidebar + mobile header + children + bottom nav)
 *
 * Lives inside a <Suspense> in layout.tsx so Next.js streams correctly.
 */
export default async function AuthShell({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen bg-[#f5f4f1]">
      <Sidebar userRole={session.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader />
        {children}
      </div>
      <BottomNav userRole={session.role} />
    </div>
  );
}
