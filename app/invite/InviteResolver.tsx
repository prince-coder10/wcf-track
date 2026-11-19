"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, CheckCircle2, RefreshCw, ArrowRight } from "lucide-react";
import { ROLE_CONFIG, Role } from "@/lib/permissions";

interface RecognizedUser {
  id: string;
  fullName: string;
  login: string;
  role: Role;
  unit?: string;
}

export default function InviteResolver() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const uid = searchParams.get("uid");

  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(token));
  const [error, setError] = useState<string | null>(() =>
    token
      ? null
      : "No invitation token was found in the link. Please check your invitation URL."
  );
  const [recognizedUser, setRecognizedUser] = useState<RecognizedUser | null>(null);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    async function verify() {
      try {
        const query = new URLSearchParams();
        query.set("token", token as string);
        if (uid) query.set("uid", uid);

        const res = await fetch(`/api/invite/verify?${query.toString()}`);
        const data = await res.json();

        if (!isMounted) return;

        if (!res.ok || !data.valid) {
          setError(data.error || "This invitation link is invalid or has expired.");
          setIsLoading(false);
          return;
        }

        setRecognizedUser(data.user);
        setIsLoading(false);

        // Automatically redirect to set-password page after a brief moment
        const timer = setTimeout(() => {
          const forwardQuery = new URLSearchParams();
          forwardQuery.set("token", token as string);
          if (uid) forwardQuery.set("uid", uid);
          router.replace(`/set-password?${forwardQuery.toString()}`);
        }, 1200);

        return () => clearTimeout(timer);
      } catch {
        if (!isMounted) return;
        setError("Network connection error. Please try again.");
        setIsLoading(false);
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token, uid, router]);

  const roleMeta = recognizedUser
    ? ROLE_CONFIG[recognizedUser.role] || {
        label: recognizedUser.role,
        badgeClass: "bg-gray-100 text-gray-700",
      }
    : null;

  return (
    <main className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center">
        {/* WCF Logo */}
        <div className="w-20 h-20 relative mb-5 rounded-full overflow-hidden shadow-sm">
          <Image
            src="/logos/logo-192.png"
            alt="Winners Campus Fellowship Logo"
            fill
            sizes="80px"
            className="object-cover scale-105"
            priority
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3 py-4">
            <RefreshCw
              size={28}
              className="animate-spin text-[#c83226] mx-auto"
            />
            <h2 className="text-lg font-bold text-gray-900">
              Verifying invitation…
            </h2>
            <p className="text-xs text-gray-500">
              Recognizing your account and preparing password setup.
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="space-y-4 py-2 w-full animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Invalid or Expired Link
              </h2>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                {error}
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-2">
              <p className="text-[11px] text-gray-400">
                Please contact your fellowship unit head to receive a fresh
                24-hour setup link.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-2.5 px-4 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
              >
                Go to Sign in
              </Link>
            </div>
          </div>
        )}

        {/* Recognized & Redirecting State */}
        {!isLoading && recognizedUser && (
          <div className="space-y-4 py-2 w-full animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Account Recognized
              </span>
              <h2 className="text-xl font-bold text-gray-900 mt-2">
                Welcome, {recognizedUser.fullName}!
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Account: <strong className="font-semibold text-gray-700">{recognizedUser.login}</strong>
              </p>
            </div>

            {roleMeta && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-left">
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase block">
                    Assigned Role
                  </span>
                  <span className="text-xs font-medium text-gray-800">
                    {roleMeta.label}
                  </span>
                </div>
                {recognizedUser.unit && (
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase block">
                      Unit
                    </span>
                    <span className="text-xs font-medium text-gray-800">
                      {recognizedUser.unit}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2">
              <Link
                href={`/set-password?token=${token}${uid ? `&uid=${uid}` : ""}`}
                className="w-full py-3 px-4 bg-[#c83226] hover:bg-[#b02b20] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                Continue to set password
                <ArrowRight size={14} />
              </Link>
              <p className="text-[11px] text-gray-400 mt-2 flex items-center justify-center gap-1.5">
                <RefreshCw size={11} className="animate-spin text-gray-400" />
                Redirecting automatically…
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
