"use client";

import { PersonResponse } from "@/lib/status";

interface ResponsePillSelectorProps {
  value: PersonResponse | "";
  onChange: (val: PersonResponse) => void;
}

const RESPONSE_OPTIONS: { id: PersonResponse; label: string }[] = [
  { id: "received_christ", label: "Received Christ" },
  { id: "interested", label: "Interested" },
  { id: "just_listened", label: "Just listened" },
  { id: "not_yet", label: "Not yet" },
];

export default function ResponsePillSelector({
  value,
  onChange,
}: ResponsePillSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs sm:text-sm font-bold text-slate-900">
        Their response <span className="text-rose-600">*</span>
      </label>
      <div className="flex flex-wrap gap-2.5">
        {RESPONSE_OPTIONS.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] ${
                isSelected
                  ? "bg-slate-900 text-white shadow-md ring-2 ring-slate-900/10"
                  : "bg-white text-slate-800 border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
