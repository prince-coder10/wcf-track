"use client";

import { useState } from "react";
import { DashboardStats } from "@/services/dashboard.service";

type Period = "week" | "month";

interface StatCardProps {
  label: string;
  value: number;
  sub: string;
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-3xl font-bold text-gray-900 leading-none">{value}</span>
      <span className="text-xs text-gray-400">{sub}</span>
    </div>
  );
}

export default function StatsGrid({ stats }: { stats: DashboardStats }) {
  const [period, setPeriod] = useState<Period>("week");

  const currentStats = stats[period];
  const items: StatCardProps[] = [
    {
      label: "Evangelized",
      value: currentStats.evangelized,
      sub: period === "week" ? "this week" : "this month",
    },
    {
      label: "Assigned",
      value: currentStats.assigned,
      sub: `${currentStats.unassignedWaiting} waiting`,
    },
    {
      label: "Contacted",
      value: currentStats.contacted,
      sub: `${currentStats.contactedPercentage}% of assigned`,
    },
    {
      label: "Integrated",
      value: currentStats.integrated,
      sub: period === "week" ? "this week" : "this month",
    },
  ];

  return (
    <div className="space-y-3">
      {/* Period toggle */}
      <div className="flex items-center gap-2">
        <div className="flex bg-gray-100 rounded-full p-0.5 text-sm">
          {(["week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-full font-medium capitalize transition-all ${
                period === p
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>
    </div>
  );
}
