"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  RefreshCw,
  Lock,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface ResetUserInfo {
  id: string;
  fullName: string;
  login: string;
  role: string;
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const uid = searchParams.get("uid");

  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(() => Boolean(token));
  const [tokenError, setTokenError] = useState<string | null>(() =>
    token ? null : "Missing password reset token. Please check your link."
  );
  const [user, setUser] = useState<ResetUserInfo | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate token and check 10 min expiry on load
  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    async function verifyToken() {
      try {
        const query = new URLSearchParams();
        query.set("token", token as string);
        if (uid) query.set("uid", uid);

        const res = await fetch(`/api/auth/reset-password?${query.toString()}`);
        const data = await res.json();

        if (!isMounted) return;

        if (!res.ok || !data.valid) {
          setTokenError(data.error || "Password reset link is invalid or has expired.");
          setIsLoadingUser(false);
          return;
        }

        setUser(data.user);
        setIsLoadingUser(false);
      } catch {
        if (!isMounted) return;
        setTokenError("Network error checking reset link. Please refresh.");
        setIsLoadingUser(false);
      }
    }

    void verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token, uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          uid: uid || undefined,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to reset password. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      const targetDestination = data.redirect || "/dashboard";
      setTimeout(() => {
        router.replace(targetDestination);
      }, 1500);
    } catch {
      setFormError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  const hasMinLength = password.length >= 8;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  return (
    <main className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-sm border border-gray-100 p-7 sm:p-8 flex flex-col items-center">
        {/* WCF Logo */}
        <div className="w-20 h-20 relative mb-4 rounded-full overflow-hidden shadow-sm">
          <Image
            src="/logos/logo-192.png"
            alt="Winners Campus Fellowship Logo"
            fill
            sizes="80px"
            className="object-cover scale-105"
            priority
          />
        </div>

        {/* Loading */}
        {isLoadingUser && (
          <div className="py-8 text-center space-y-3">
            <RefreshCw size={24} className="animate-spin text-[#c83226] mx-auto" />
            <p className="text-xs text-gray-500">Verifying one-time reset link…</p>
          </div>
        )}

        {/* Invalid or Expired Token */}
        {!isLoadingUser && tokenError && (
          <div className="w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Link Expired or Invalid</h2>
              <p className="text-xs text-gray-500 mt-1">{tokenError}</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800 text-left flex items-start gap-2">
              <Clock size={16} className="shrink-0 mt-0.5 text-amber-600" />
              <span>Password reset links expire 10 minutes after generation for security.</span>
            </div>
            <Link
              href="/forgot-password"
              className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-[#c83226] hover:bg-[#b02b20] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              Request a new reset link
            </Link>
          </div>
        )}

        {/* Success Transition */}
        {!isLoadingUser && !tokenError && isSuccess && (
          <div className="w-full text-center py-6 space-y-3 animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Password Changed!</h2>
            <p className="text-xs text-gray-500">Signing you in securely…</p>
          </div>
        )}

        {/* Password Reset Form */}
        {!isLoadingUser && !tokenError && !isSuccess && user && (
          <div className="w-full space-y-5">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Create New Password</h1>
              <p className="text-xs text-gray-500 mt-1">
                For account <span className="font-semibold text-gray-800">{user.login}</span>
              </p>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isSubmitting}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    disabled={isSubmitting}
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Requirements Checklist */}
              <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                      hasMinLength ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <Check size={9} strokeWidth={3} />
                  </div>
                  <span className={hasMinLength ? "text-gray-700" : "text-gray-400"}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                      passwordsMatch ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <Check size={9} strokeWidth={3} />
                  </div>
                  <span className={passwordsMatch ? "text-gray-700" : "text-gray-400"}>
                    Passwords match
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || !hasMinLength || !passwordsMatch}
                className="w-full py-3 px-4 bg-[#c83226] hover:bg-[#b02b20] active:bg-[#9c251b] disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Updating password…
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    Reset password &amp; sign in
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
