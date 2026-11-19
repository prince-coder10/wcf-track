"use client";

import { UserPlus, RefreshCw, X } from "lucide-react";

interface PeopleActionBarProps {
  selectedCount: number;
  onOpenAssignModal: (mode: "assign" | "reassign") => void;
  onClearSelection: () => void;
}

export default function PeopleActionBar({
  selectedCount,
  onOpenAssignModal,
  onClearSelection,
}: PeopleActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-20 md:bottom-6 z-30 flex items-center justify-between gap-3 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm">
          {selectedCount} selected
        </span>
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenAssignModal("assign")}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition active:scale-[0.98]"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Assign to...</span>
        </button>
        <button
          type="button"
          onClick={() => onOpenAssignModal("reassign")}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-slate-900 hover:bg-slate-100 shadow-sm transition active:scale-[0.98]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reassign</span>
        </button>
      </div>
    </div>
  );
}
