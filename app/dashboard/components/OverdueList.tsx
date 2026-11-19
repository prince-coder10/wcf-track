"use client";

interface OverduePerson {
  name: string;
  assignee: string;
  days: number;
}

const OVERDUE: OverduePerson[] = [
  { name: "Tunde Adeyemi", assignee: "Grace O.",  days: 9 },
  { name: "Ife Lawal",     assignee: "Samuel K.", days: 8 },
  { name: "Kunle Ade",     assignee: "Grace O.",  days: 7 },
  { name: "Ada Nwosu",     assignee: "Peter M.",  days: 11 },
  { name: "Bola Fashola",  assignee: "Amaka T.",  days: 7 },
];

function dayColor(days: number) {
  if (days >= 10) return "text-red-700";
  if (days >= 8)  return "text-red-600";
  return "text-orange-500";
}

export default function OverdueList() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3">
      <div>
        <h2 className="font-semibold text-gray-900 text-sm">
          Overdue ({OVERDUE.length})
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          No check-in in 7+ days · limit set by admin
        </p>
      </div>

      <div className="divide-y divide-gray-50">
        {OVERDUE.map((p) => (
          <div
            key={p.name}
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
            <button className="shrink-0 text-xs font-medium text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors">
              Reassign
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
