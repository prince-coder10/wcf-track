"use client";

import { ContactMethod } from "@/lib/status";

interface ContactMethodSelectorProps {
  value: ContactMethod | "";
  onChange: (val: ContactMethod) => void;
}

const METHODS: { id: ContactMethod; label: string }[] = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "call", label: "Call" },
  { id: "visit", label: "Visit" },
];

export default function ContactMethodSelector({
  value,
  onChange,
}: ContactMethodSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs sm:text-sm font-bold text-slate-900">
        Best way to reach them
      </label>
      <div className="flex flex-wrap gap-2.5">
        {METHODS.map((m) => {
          const isSelected = value === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-[0.98] ${
                isSelected
                  ? "bg-slate-900 text-white shadow-md ring-2 ring-slate-900/10"
                  : "bg-white text-slate-800 border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
