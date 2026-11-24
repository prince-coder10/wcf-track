"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UnassignedQueueItem } from "@/services/dashboard.service";
import { Users, Loader2 } from "lucide-react";

export default function UnassignedQueue({ queue }: { queue: UnassignedQueueItem[] }) {
  const router = useRouter();
  const [isAssigning, setIsAssigning] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const handleAssignAllEvenly = async () => {
    setIsAssigning(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/people/assign-evenly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to distribute queue.");
      }

      setFeedback({ type: "success", text: data.message });
      router.refresh();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to distribute.",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900 text-sm">
            Unassigned queue ({queue.length})
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Waiting for a follow-up member
          </p>
        </div>
        {queue.length > 0 && (
          <Link
            href="/dashboard/people?tab=unassigned"
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            View all
          </Link>
        )}
      </div>

      {feedback && (
        <div
          className={`text-xs p-2.5 rounded-lg border ${
            feedback.type === "success"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="divide-y divide-gray-50">
        {queue.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            No unassigned people waiting
          </p>
        ) : (
          queue.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between py-2.5 gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {p.name}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {p.hall} · {p.daysAgo} day{p.daysAgo !== 1 ? "s" : ""}
                </p>
              </div>
              <Link
                href={`/dashboard/people/${p.id}`}
                className="shrink-0 text-xs font-medium text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Assign
              </Link>
            </div>
          ))
        )}
      </div>

      {queue.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 mt-1">
          <button
            onClick={handleAssignAllEvenly}
            disabled={isAssigning}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-[#c83226] hover:bg-[#b02b20] active:bg-[#9c251b] disabled:opacity-50 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            {isAssigning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Assigning evenly...</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                <span>Assign all evenly</span>
              </>
            )}
          </button>
          <Link
            href="/dashboard/people?tab=unassigned"
            className="text-center py-2.5 px-3 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-medium rounded-lg transition-colors"
          >
            Manage queue
          </Link>
        </div>
      )}
    </div>
  );
}
