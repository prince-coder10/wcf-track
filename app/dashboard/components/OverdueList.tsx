"use client";

import Link from "next/link";
import { OverdueItem } from "@/services/dashboard.service";

function dayColor(days: number) {
  if (days >= 10) return "text-red-700";
  if (days >= 8) return "text-red-600";
  return "text-orange-500";
}

export default function OverdueList({ overdueList }: { overdueList: OverdueItem[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900 text-sm">
            Overdue ({overdueList.length})
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            No check-in in 7+ days
          </p>
        </div>
        {overdueList.length > 0 && (
          <Link
            href="/dashboard/people?tab=overdue"
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            View all
          </Link>
        )}
      </div>

      <div className="divide-y divide-gray-50">
        {overdueList.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            No overdue follow-ups
          </p>
        ) : (
          overdueList.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between py-2.5 gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {p.name}
                </p>
                <p className="text-xs truncate">
                  <span className="text-gray-400">{p.assignee}</span>{" "}
                  <span className={`font-semibold ${dayColor(p.days)}`}>
                    {p.days} days
                  </span>
                </p>
              </div>
              <Link
                href={`/dashboard/people/${p.id}`}
                className="shrink-0 text-xs font-medium text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                View
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
