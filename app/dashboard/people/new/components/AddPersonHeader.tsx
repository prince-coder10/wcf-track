"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function AddPersonHeader() {
  return (
    <div className="space-y-2 pb-1">
      {/* Back button + Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/people"
          className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 transition active:scale-95 border border-slate-300 shadow-sm"
          title="Back to people list"
        >
          <ChevronLeft className="w-5 h-5 -ml-0.5 text-slate-800 stroke-[2.5]" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Add person
        </h1>
      </div>

      {/* Helper text */}
      <p className="text-xs sm:text-sm text-slate-600 font-medium pl-0.5">
        Required fields first. You can finish the rest later.
      </p>
    </div>
  );
}
