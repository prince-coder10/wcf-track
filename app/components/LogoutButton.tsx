"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  variant?: "desktop" | "mobile";
}

export default function LogoutButton({ variant = "desktop" }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.replace("/login");
      router.refresh();
    } catch {
      router.replace("/login");
    }
  };

  if (variant === "mobile") {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="p-2 rounded-xl text-gray-500 hover:text-red-600 active:bg-red-50 hover:bg-gray-100 transition-colors"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className={`w-5 h-5 ${isLoggingOut ? "animate-pulse" : ""}`} />
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer group"
    >
      <LogOut size={16} strokeWidth={1.8} className="group-hover:translate-x-0.5 transition-transform" />
      <span>{isLoggingOut ? "Signing out…" : "Sign out"}</span>
    </button>
  );
}
