import { Suspense } from "react";
import AuthShell from "./components/AuthShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <AuthShell>{children}</AuthShell>
    </Suspense>
  );
}
