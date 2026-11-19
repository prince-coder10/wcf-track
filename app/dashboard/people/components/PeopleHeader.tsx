"use client";

import Link from "next/link";
import { Download, UserPlus } from "lucide-react";
import { Role, roleHasPermission, PERMISSION_ACTIONS } from "@/lib/permissions";

interface PeopleHeaderProps {
  userRole?: Role;
  totalCount: number;
  onExport: () => void;
  isExporting: boolean;
}

export default function PeopleHeader({
  userRole,
  totalCount,
  onExport,
  isExporting,
}: PeopleHeaderProps) {
  const isEvangelist = userRole === "evangelist";
  const canCreate = userRole ? roleHasPermission(userRole, PERMISSION_ACTIONS.PEOPLE_CREATE) : false;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          People
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {isEvangelist
            ? "People you personally evangelized to"
            : `All evangelized people (${totalCount})`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {canCreate && (
          <Link
            href="/dashboard/people/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition active:scale-[0.98] shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add person</span>
          </Link>
        )}

        <button
          type="button"
          onClick={onExport}
          disabled={isExporting || totalCount === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-[0.98] disabled:opacity-50 shadow-sm"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>{isExporting ? "Exporting..." : "Export list"}</span>
        </button>
      </div>
    </div>
  );
}
