"use client";

import { Search, ChevronDown, X } from "lucide-react";
import { UserOption } from "../types";
import { Role } from "@/lib/permissions";

interface PeopleFiltersProps {
  userRole?: Role;
  search: string;
  onSearchChange: (val: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedHall: string;
  onHallChange: (hall: string) => void;
  selectedEvangelist: string;
  onEvangelistChange: (evangelist: string) => void;
  selectedAssignedTo: string;
  onAssignedToChange: (assignedTo: string) => void;
  halls: string[];
  evangelists: UserOption[];
  followUpUsers: UserOption[];
  onResetFilters: () => void;
}

export default function PeopleFilters({
  userRole,
  search,
  onSearchChange,
  activeTab,
  onTabChange,
  selectedStatus,
  onStatusChange,
  selectedHall,
  onHallChange,
  selectedEvangelist,
  onEvangelistChange,
  selectedAssignedTo,
  onAssignedToChange,
  halls,
  evangelists,
  followUpUsers,
  onResetFilters,
}: PeopleFiltersProps) {
  const isEvangelist = userRole === "evangelist";
  const hasActiveFilters =
    search ||
    activeTab !== "all" ||
    selectedStatus !== "all" ||
    selectedHall !== "all" ||
    selectedEvangelist !== "all" ||
    selectedAssignedTo !== "all";

  const tabs = [
    { id: "all", label: "All" },
    { id: "unassigned", label: "Unassigned" },
    { id: "overdue", label: "Overdue" },
  ];

  if (userRole === "follow_up") {
    tabs.push({ id: "my", label: "My People" });
  }

  return (
    <div className="space-y-3">
      {/* Search Bar + Quick Tabs Row */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name, phone or hall"
            className="w-full pl-10 pr-4 py-2.5 rounded-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/20 transition shadow-sm"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filter Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 transition cursor-pointer shadow-sm"
          >
            <option value="all">Status: All</option>
            <option value="new">New</option>
            <option value="assigned">Assigned</option>
            <option value="contacted">Contacted</option>
            <option value="met">Met in person</option>
            <option value="integrated">Integrated</option>
            <option value="unreachable">Unreachable</option>
            <option value="closed">Closed</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Hall Dropdown */}
        <div className="relative">
          <select
            value={selectedHall}
            onChange={(e) => onHallChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 transition cursor-pointer shadow-sm"
          >
            <option value="all">Hall: All</option>
            {halls.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Evangelist Dropdown (only visible to leadership who can see all people) */}
        {!isEvangelist && (
          <div className="relative">
            <select
              value={selectedEvangelist}
              onChange={(e) => onEvangelistChange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 transition cursor-pointer shadow-sm"
            >
              <option value="all">Evangelist: All</option>
              {evangelists.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.fullName}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        )}

        {/* Assigned To Dropdown */}
        <div className="relative">
          <select
            value={selectedAssignedTo}
            onChange={(e) => onAssignedToChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 transition cursor-pointer shadow-sm"
          >
            <option value="all">Assigned to: All</option>
            <option value="unassigned">Unassigned</option>
            {followUpUsers.map((u) => (
              <option key={u._id} value={u._id}>
                {u.fullName}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
