"use client";

import { CheckCircle2, Plus, ArrowRight } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  personName: string;
  onAddAnother: () => void;
  onGoToPeople: () => void;
}

export default function SuccessModal({
  isOpen,
  personName,
  onAddAnother,
  onGoToPeople,
}: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-sm shadow-2xl space-y-5 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Person added!
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200">{personName}</span> has been recorded successfully.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={onAddAnother}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition active:scale-[0.98] shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add another person</span>
          </button>

          <button
            type="button"
            onClick={onGoToPeople}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition active:scale-[0.98]"
          >
            <span>View in People list</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
