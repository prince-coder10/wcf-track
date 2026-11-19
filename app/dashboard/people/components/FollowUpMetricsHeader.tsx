"use client";

import { AlertTriangle } from "lucide-react";

interface FollowUpMetricsHeaderProps {
  userName?: string;
  assignedCount: number;
  newCount: number;
  overdueCount: number;
}

export default function FollowUpMetricsHeader({
  userName = "Team member",
  assignedCount,
  newCount,
  overdueCount,
}: FollowUpMetricsHeaderProps) {
  const firstName = userName.split(" ")[0];

  return (
    <div className="space-y-4 pb-2">
      {/* Greeting Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Hi, {firstName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Follow-up team
        </p>
      </div>

      {/* 3 Top Metric Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {/* Assigned */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200 shadow-sm">
          <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Assigned
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {assignedCount}
          </p>
        </div>

        {/* New */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200 shadow-sm">
          <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide">
            New
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {newCount}
          </p>
        </div>

        {/* Overdue */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border-2 border-rose-200 bg-rose-50/20 shadow-sm">
          <p className="text-[11px] sm:text-xs font-bold text-rose-700 uppercase tracking-wide">
            Overdue
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">
            {overdueCount}
          </p>
        </div>
      </div>

      {/* 7+ Days Overdue Alert Banner (matching mockup 1) */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-[#fee2e2]/70 border border-[#fca5a5] text-[#991b1b] text-xs sm:text-sm animate-in fade-in duration-200">
          <AlertTriangle className="w-4 h-4 text-[#dc2626] shrink-0 stroke-[2.2]" />
          <span className="font-semibold">
            {overdueCount} {overdueCount === 1 ? "person" : "people"} not contacted in 7+ days (limit set by your lead)
          </span>
        </div>
      )}
    </div>
  );
}
