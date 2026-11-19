"use client";

import { useState } from "react";

interface QueuePerson {
  name: string;
  hall: string;
  daysAgo: number;
}

const QUEUE: QueuePerson[] = [
  { name: "Chioma Okafor",   hall: "Queen Idia Hall",   daysAgo: 2 },
  { name: "Emeka Obi",       hall: "McIlaridy Hall",    daysAgo: 1 },
  { name: "Sade Bakare",     hall: "Independence Hall", daysAgo: 1 },
  { name: "Kemi Adebayo",    hall: "Queen Amina Hall",  daysAgo: 3 },
  { name: "Tobi Nwachukwu",  hall: "Moremi Hall",       daysAgo: 1 },
  { name: "Funke Abiodun",   hall: "Queen Idia Hall",   daysAgo: 4 },
  { name: "Yusuf Bello",     hall: "Sanda Hall",        daysAgo: 2 },
];

export default function UnassignedQueue() {
  const [assigned, setAssigned] = useState<Set<number>>(new Set());
  const [allAssigned, setAllAssigned] = useState(false);

  const assign = (i: number) => setAssigned((prev) => new Set([...prev, i]));
  const assignAll = () => setAllAssigned(true);

  const visible = QUEUE.filter((_, i) => !assigned.has(i) && !allAssigned);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3">
      <div>
        <h2 className="font-semibold text-gray-900 text-sm">
          Unassigned queue ({visible.length})
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Waiting for a follow-up member
        </p>
      </div>

      <div className="divide-y divide-gray-50">
        {visible.length === 0 ? (
          <p className="text-sm text-green-600 py-2">
            ✓ All people have been assigned
          </p>
        ) : (
          visible.map((p) => (
            <div
              key={p.name}
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
              <button
                onClick={() => assign(QUEUE.indexOf(p))}
                className="shrink-0 text-xs font-medium text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Assign
              </button>
            </div>
          ))
        )}
      </div>

      {!allAssigned && visible.length > 0 && (
        <button
          onClick={assignAll}
          className="w-full py-3 bg-[#c83226] hover:bg-[#b02b20] active:bg-[#9c251b] text-white text-sm font-medium rounded-lg transition-colors"
        >
          Assign all evenly
        </button>
      )}
    </div>
  );
}
