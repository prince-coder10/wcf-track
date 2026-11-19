import { Suspense } from "react";
import SetPasswordForm from "./SetPasswordForm";

export const metadata = {
  title: "Set Password | WCF Evangelism & Follow-up",
  description: "Set your password to activate your account",
};

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
          <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4 animate-pulse">
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto"></div>
            <div className="h-5 w-48 bg-gray-200 rounded mx-auto"></div>
            <div className="h-4 w-64 bg-gray-200/70 rounded mx-auto"></div>
          </div>
        </div>
      }
    >
      <SetPasswordForm />
    </Suspense>
  );
}
