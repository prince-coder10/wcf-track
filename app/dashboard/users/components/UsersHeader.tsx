"use client";

import { Users, UserPlus } from "lucide-react";
import { MobileTab } from "../types";

interface UsersHeaderProps {
  totalCount: number;
  mobileTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export default function UsersHeader({
  totalCount,
  mobileTab,
  onTabChange,
}: UsersHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Users &amp; roles
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Only admins and authorized executives can manage accounts and roles.
        </p>
      </div>

      {/* Mobile Segmented Switcher for 1-tap view switching */}
      <div className="flex md:hidden items-center p-1 bg-gray-200/80 rounded-lg self-start sm:self-auto w-full">
        <button
          type="button"
          onClick={() => onTabChange("list")}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === "list"
              ? "bg-white text-gray-900 shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Users size={14} />
          Users ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => onTabChange("create")}
          className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === "create"
              ? "bg-[#c83226] text-white shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <UserPlus size={14} />
          Create account
        </button>
      </div>
    </div>
  );
}
