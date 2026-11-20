"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mail, Clock, CheckCircle2, Copy, Check } from "lucide-react";

export default function ForgotPasswordPage() {
  const [login, setLogin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    resetUrl?: string;
    expiresInMinutes?: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to process request. Please try again.");
        return;
      }

      setSuccessData({
        resetUrl: data.resetUrl,
        expiresInMinutes: data.expiresInMinutes || 10,
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!successData?.resetUrl) return;
    navigator.clipboard.writeText(successData.resetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center">
        {/* Logo */}
        <div className="w-24 h-24 relative mb-4 rounded-full overflow-hidden shadow-sm">
          <Image
            src="/logos/logo-192.png"
            alt="Winners Campus Fellowship Logo"
            fill
            sizes="96px"
            className="object-cover scale-105"
            priority
          />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Forgot password?
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Get a one-time link to reset your account password.
          </p>
        </div>

        {error && (
          <div className="w-full mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        {successData ? (
          <div className="w-full space-y-4 animate-in fade-in duration-300">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900">
                <p className="font-semibold text-emerald-800">Password reset link dispatched</p>
                <p className="mt-0.5 text-emerald-700">
                  If an active account matches that email, a 10-minute reset link has been sent to your inbox.
                </p>
                <p className="mt-1 text-emerald-700 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 inline" /> Link expires in {successData.expiresInMinutes} minutes.
                </p>
              </div>
            </div>

            {successData.resetUrl && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                <span className="text-[11px] font-medium text-gray-600 block">
                  Dev/Local fallback preview:
                </span>
                <div className="flex gap-2">
                  <Link
                    href={successData.resetUrl}
                    className="flex-1 text-center py-2 px-3 bg-[#c83226] hover:bg-[#b02b20] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                  >
                    Open Reset Link
                  </Link>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 border border-gray-200 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                    title="Copy reset link"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-xs font-medium text-gray-500 hover:text-gray-800 inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="login"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wide"
              >
                Email or username
              </label>
              <div className="relative">
                <input
                  id="login"
                  name="login"
                  type="text"
                  required
                  disabled={isLoading}
                  placeholder="e.g. samuel.k or samuel@wcf.org"
                  value={login}
                  onChange={(e) => {
                    setLogin(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg text-[11px] text-blue-700">
              <Clock className="w-4 h-4 shrink-0 text-blue-500" />
              <span>For security, the one-time reset link will expire in exactly 10 minutes.</span>
            </div>

            <button
              type="submit"
              disabled={isLoading || !login.trim()}
              className="w-full py-2.5 px-4 bg-[#c83226] hover:bg-[#b02b20] active:bg-[#9c251b] disabled:bg-gray-300 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <Mail className="w-4 h-4" />
              {isLoading ? "Generating link…" : "Get one-time reset link"}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="text-xs font-medium text-gray-500 hover:text-gray-800 inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
