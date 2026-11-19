"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Download,
  Search,
  Eye,
  CheckCircle2,
  UserCheck,
  UserPlus,
  FileSpreadsheet,
  ShieldAlert,
  Edit3,
} from "lucide-react";

interface ActivityLogItem {
  _id: string;
  userName: string;
  userRole: string;
  action: string;
  targetType: string;
  targetId: string | null;
  targetLabel: string;
  details: string;
  createdAt: string;
}

interface ActivityLogClientProps {
  initialData: {
    logs: ActivityLogItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  users: Array<{ _id: string; fullName: string; role: string }>;
  currentFilters: {
    search: string;
    userId: string;
    action: string;
    dateRange: string;
    page: number;
  };
}

export default function ActivityLogClient({
  initialData,
  users,
  currentFilters,
}: ActivityLogClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(currentFilters.search);
  const [selectedUser, setSelectedUser] = useState(currentFilters.userId);
  const [selectedAction, setSelectedAction] = useState(currentFilters.action);
  const [selectedRange, setSelectedRange] = useState(currentFilters.dateRange);

  const applyFilters = (updates: Partial<typeof currentFilters>) => {
    const params = new URLSearchParams();
    const s = updates.search !== undefined ? updates.search : search;
    const u = updates.userId !== undefined ? updates.userId : selectedUser;
    const a = updates.action !== undefined ? updates.action : selectedAction;
    const r = updates.dateRange !== undefined ? updates.dateRange : selectedRange;

    if (s) params.set("search", s);
    if (u) params.set("userId", u);
    if (a && a !== "all") params.set("action", a);
    if (r && r !== "all") params.set("dateRange", r);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search });
  };

  const formatWhen = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isToday) return `Today ${timeStr}`;

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return `Yesterday ${timeStr}`;

    return `${date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })} ${timeStr}`;
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "viewed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Eye className="w-3 h-3 text-slate-500" />
            Viewed
          </span>
        );
      case "check_in":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            Check-in
          </span>
        );
      case "reassigned":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <UserCheck className="w-3 h-3 text-amber-600" />
            Reassigned
          </span>
        );
      case "created":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <UserPlus className="w-3 h-3 text-emerald-600" />
            Created
          </span>
        );
      case "exported":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 font-bold">
            <FileSpreadsheet className="w-3 h-3 text-rose-600" />
            Exported
          </span>
        );
      case "account":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 font-bold">
            <ShieldAlert className="w-3 h-3 text-teal-600" />
            Account
          </span>
        );
      case "edited":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <Edit3 className="w-3 h-3 text-orange-600" />
            Edited
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {action}
          </span>
        );
    }
  };

  const getExportUrl = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedUser) params.set("userId", selectedUser);
    if (selectedAction) params.set("action", selectedAction);
    if (selectedRange) params.set("dateRange", selectedRange);
    return `/api/activity/export?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Activity log
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Who viewed or changed a record
          </p>
        </div>

        <div>
          <a
            href={getExportUrl()}
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 transition shadow-sm active:scale-[0.98]"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export log</span>
          </a>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search person or user"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </form>

        {/* User filter */}
        <div className="min-w-[140px]">
          <select
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              applyFilters({ userId: e.target.value });
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Action filter */}
        <div className="min-w-[130px]">
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              applyFilters({ action: e.target.value });
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="">All Actions</option>
            <option value="viewed">Viewed</option>
            <option value="check_in">Check-in</option>
            <option value="reassigned">Reassigned</option>
            <option value="created">Created</option>
            <option value="exported">Exported</option>
            <option value="account">Account</option>
            <option value="edited">Edited</option>
          </select>
        </div>

        {/* Date range pills */}
        <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setSelectedRange("7d");
              applyFilters({ dateRange: "7d" });
            }}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedRange === "7d"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Last 7 days
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRange("30d");
              applyFilters({ dateRange: "30d" });
            }}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedRange === "30d"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Last 30 days
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRange("all");
              applyFilters({ dateRange: "all" });
            }}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedRange === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-5">When</th>
                <th className="py-3.5 px-4">Who</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Record</th>
                <th className="py-3.5 px-5">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {initialData.logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No activity logs found for this filter.
                  </td>
                </tr>
              ) : (
                initialData.logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                    {/* When */}
                    <td className="py-3.5 px-5 whitespace-nowrap text-slate-600 font-medium">
                      {formatWhen(log.createdAt)}
                    </td>

                    {/* Who */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-900">
                      {log.userName}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    {/* Record */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-900">
                      {log.targetType === "person" && log.targetId ? (
                        <Link
                          href={`/dashboard/people/${log.targetId}`}
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          {log.targetLabel}
                        </Link>
                      ) : (
                        <span>{log.targetLabel}</span>
                      )}
                    </td>

                    {/* Detail */}
                    <td className="py-3.5 px-5 text-slate-600 max-w-xs truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info Notice */}
      <div className="p-4 rounded-2xl bg-[#faf9f5] border border-amber-200/60 text-xs text-slate-600 flex items-center justify-between">
        <span>
          Log entries cannot be edited or deleted. Exports and account changes are highlighted so admins can spot them quickly.
        </span>
        <span className="font-semibold text-slate-500">
          Total records: {initialData.total}
        </span>
      </div>
    </div>
  );
}
