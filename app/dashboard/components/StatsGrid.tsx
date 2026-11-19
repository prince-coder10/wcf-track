"use client";

import { useState } from "react";

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

const STATS: Record<Period, StatCardProps[]> = {
  week: [
    { label: "Evangelized",  value: 48, sub: "this week" },
    { label: "Assigned",     value: 41, sub: "7 waiting" },
    { label: "Contacted",    value: 33, sub: "80% of assigned" },
    { label: "Integrated",   value:  9, sub: "this week" },
  ],
  month: [
    { label: "Evangelized",  value: 194, sub: "this month" },
    { label: "Assigned",     value: 178, sub: "16 waiting" },
    { label: "Contacted",    value: 141, sub: "79% of assigned" },
    { label: "Integrated",   value:  37, sub: "this month" },
  ],
};

export default function StatsGrid() {
  const [period, setPeriod] = useState<Period>("week");

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
        <button className="ml-auto flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-2 rounded-full transition-colors">
          {/* WhatsApp icon */}
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.862L.057 23.882a.5.5 0 0 0 .613.613l6.014-1.476A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.51-5.17-1.395l-.37-.22-3.57.876.893-3.482-.242-.38A9.95 9.95 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
          <span className="hidden sm:inline">Share summary</span>
          <span className="sm:hidden">Share</span>
        </button>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATS[period].map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>
    </div>
  );
}
