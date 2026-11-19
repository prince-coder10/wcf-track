"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { ROLE_CONFIG, Role } from "@/lib/permissions";

interface UserProfile {
  id: string;
  fullName: string;
  login: string;
  role: Role;
  unit?: string;
}

export default function SetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const uid = searchParams.get("uid");

  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(() => Boolean(token));
  const [tokenError, setTokenError] = useState<string | null>(() =>
    token ? null : "Missing invitation token. Please check your link."
  );
  const [user, setUser] = useState<UserProfile | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate token and fetch recognized user info
  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    async function loadUser() {
      try {
        const query = new URLSearchParams();
        query.set("token", token as string);
        if (uid) query.set("uid", uid);

        const res = await fetch(`/api/invite/verify?${query.toString()}`);
        const data = await res.json();

        if (!isMounted) return;

        if (!res.ok || !data.valid) {
          setTokenError(data.error || "Invitation link is invalid or expired.");
          setIsLoadingUser(false);
          return;
        }

        setUser(data.user);
        setIsLoadingUser(false);
      } catch {
        if (!isMounted) return;
        setTokenError("Network error checking invitation. Please refresh.");
        setIsLoadingUser(false);
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, [token, uid]);

  // Submit password setup
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
      const res = await fetch("/api/invite/set-password", {
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
        setFormError(data.error || "Failed to set password. Please try again.");
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

  const roleMeta = user
    ? ROLE_CONFIG[user.role] || {
        label: user.role,
        badgeClass: "bg-gray-100 text-gray-700",
      }
    : null;

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

        {/* Loading User Check */}
        {isLoadingUser && (
          <div className="py-8 text-center space-y-3">
            <RefreshCw
              size={24}
              className="animate-spin text-[#c83226] mx-auto"
            />
            <p className="text-xs text-gray-500">
              Verifying your invitation…
            </p>
          </div>
        )}

        {/* Token Error */}
        {!isLoadingUser && tokenError && (
          <div className="space-y-4 py-2 w-full text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Invitation Expired or Invalid
              </h2>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                {tokenError}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full py-2.5 px-4 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
              >
                Go to Sign in
              </Link>
            </div>
          </div>
        )}

        {/* Success State */}
        {!isLoadingUser && isSuccess && (
          <div className="space-y-4 py-4 w-full text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={26} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Account Activated!
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Your password has been saved. Taking you to your workspace…
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-[#c83226] font-medium pt-2">
              <RefreshCw size={13} className="animate-spin" />
              Entering WCF Evangelism &amp; Follow-up…
            </div>
          </div>
        )}

        {/* Set Password Form */}
        {!isLoadingUser && !tokenError && !isSuccess && user && (
          <div className="w-full space-y-5 animate-fade-in">
            {/* Header with Recognized User Details */}
            <div className="text-center space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Invitation Verified
              </span>
              <h1 className="text-xl font-bold text-gray-900">
                Welcome, {user.fullName}!
              </h1>
              <p className="text-xs text-gray-500">
                Set a secure password for{" "}
                <strong className="text-gray-800 font-semibold">{user.login}</strong>
              </p>

              {roleMeta && (
                <div className="inline-flex items-center gap-1.5 mt-1">
                  <span
                    className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border ${roleMeta.badgeClass}`}
                  >
                    {roleMeta.label}
                  </span>
                  {user.unit && (
                    <span className="text-[11px] text-gray-400">
                      · {user.unit}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* New Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wide"
                >
                  Create password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
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
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wide"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    disabled={isSubmitting}
                    placeholder="Repeat your password"
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
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Checklist */}
              <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                      hasMinLength
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <Check size={9} strokeWidth={3} />
                  </div>
                  <span
                    className={hasMinLength ? "text-gray-700" : "text-gray-400"}
                  >
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                      passwordsMatch
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <Check size={9} strokeWidth={3} />
                  </div>
                  <span
                    className={
                      passwordsMatch ? "text-gray-700" : "text-gray-400"
                    }
                  >
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
                    Saving password…
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    Set password &amp; sign in
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <p className="text-[11px] text-gray-400 text-center">
                Your password is encrypted securely with bcrypt before being stored.
              </p>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
