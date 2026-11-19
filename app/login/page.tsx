"use client";

import { Suspense } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Redirect to the page the user originally tried to visit, or role's landing route
      const fallback = data.redirect || "/dashboard";
      const from = searchParams.get("from") ?? fallback;
      router.replace(from);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center">
        {/* Logo */}
        <div className="w-28 h-28 relative mb-6 rounded-full overflow-hidden shadow-sm">
          <Image
            src="/logos/logo-192.png"
            alt="Winners Campus Fellowship Logo"
            fill
            sizes="112px"
            className="object-cover scale-105"
            priority
          />
        </div>

        {/* Header Titles */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Evangelism &amp; Follow-up
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Winners Campus Fellowship
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            role="alert"
            className="w-full mb-5 flex items-start gap-2.5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
          >
            {/* Warning icon */}
            <svg
              className="mt-0.5 shrink-0 w-4 h-4 text-red-500"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-5.25a.75.75 0 001.5 0v-4a.75.75 0 00-1.5 0v4zm.75 2.5a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-5" noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor="login"
              className="block text-sm font-medium text-gray-700"
            >
              Email or username
            </label>
            <input
              id="login"
              name="login"
              type="text"
              autoComplete="username"
              required
              disabled={isLoading}
              value={login}
              onChange={(e) => {
                setLogin(e.target.value);
                if (error) setError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent transition-all text-sm disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent transition-all text-sm disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <button
            id="sign-in-btn"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-[#c83226] hover:bg-[#b02b20] active:bg-[#9c251b] text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-150 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading && (
              <svg
                className="animate-spin w-4 h-4 text-white"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            {isLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Forgot Password Link */}
        <div className="mt-6 text-center">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-[#2d68c4] hover:text-[#214f96] hover:underline transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Note / Callout Box */}
        <div className="mt-8 w-full p-4 rounded-xl border border-gray-200/90 bg-gray-50/60 text-xs text-gray-600 leading-relaxed">
          <p>
            <strong className="font-semibold text-gray-800">
              No sign-up here.
            </strong>{" "}
            Accounts are created by an admin to protect people&apos;s personal
            details. Need access? Contact your unit lead.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
