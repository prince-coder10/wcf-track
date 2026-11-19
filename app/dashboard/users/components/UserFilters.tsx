"use client";

import { Search, X } from "lucide-react";
import { ROLE_CONFIG, ROLES } from "@/lib/permissions";

interface UserFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  stats: {
    total: number;
    active: number;
    invited: number;
    deactivated: number;
  };
}

export default function UserFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  roleFilter,
  onRoleFilterChange,
  stats,
}: UserFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3.5 sm:p-4 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by name, login or phone..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 sm:py-2 text-sm rounded-lg border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Dropdown Filter */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full sm:w-auto px-3 py-2.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#c83226]"
          >
            <option value="all">All statuses ({stats.total})</option>
            <option value="active">Active ({stats.active})</option>
            <option value="invited">Invited ({stats.invited})</option>
            <option value="deactivated">Deactivated ({stats.deactivated})</option>
          </select>
        </div>
      </div>

      {/* Role Filter Chips (Horizontally scrollable on small screens) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-gray-400 shrink-0 font-medium mr-1 hidden sm:inline">
          Role:
        </span>
        <button
          type="button"
          onClick={() => onRoleFilterChange("all")}
          className={`px-3 py-1.5 rounded-full shrink-0 font-medium transition-colors ${
            roleFilter === "all"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All roles
        </button>
        {ROLES.map((r) => {
          const conf = ROLE_CONFIG[r];
          const active = roleFilter === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => onRoleFilterChange(r)}
              className={`px-3 py-1.5 rounded-full shrink-0 font-medium transition-colors ${
                active
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {conf.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
