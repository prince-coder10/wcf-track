import { Suspense } from "react";
import AuthShell from "./components/AuthShell";
import PushNotificationManager from "@/app/components/PushNotificationManager";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <AuthShell>{children}</AuthShell>
      <PushNotificationManager />
    </Suspense>
  );
}
