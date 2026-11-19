"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/lib/permissions";
import { PeopleResponse } from "./types";
import PeopleHeader from "./components/PeopleHeader";
import FollowUpMetricsHeader from "./components/FollowUpMetricsHeader";
import PeopleFilters from "./components/PeopleFilters";
import PeopleTable from "./components/PeopleTable";
import PeopleCardList from "./components/PeopleCardList";
import PeopleActionBar from "./components/PeopleActionBar";
import AssignModal from "./components/AssignModal";
import PeoplePagination from "./components/PeoplePagination";
import PeopleSkeleton from "./components/PeopleSkeleton";
import { Users as EmptyUsersIcon, AlertTriangle } from "lucide-react";

interface PeopleClientProps {
  initialData: PeopleResponse;
  userRole?: Role;
}

export default function PeopleClient({
  initialData,
  userRole,
}: PeopleClientProps) {
  const router = useRouter();
  const [data, setData] = useState<PeopleResponse>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [status, setStatus] = useState("all");
  const [hall, setHall] = useState("all");
  const [evangelist, setEvangelist] = useState("all");
  const [assignedTo, setAssignedTo] = useState("all");
  const [page, setPage] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Assign modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignModalMode, setAssignModalMode] = useState<"assign" | "reassign">("assign");
  const [isExporting, setIsExporting] = useState(false);

  // Reference to abort ongoing requests and avoid race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  const isFirstMount = useRef(true);

  // Core fetch function (accepts explicit targetPage, does not trigger unwanted effects)
  const fetchPeople = useCallback(
    async (targetPage: number) => {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (activeTab !== "all") params.set("tab", activeTab);
        if (status !== "all") params.set("status", status);
        if (hall !== "all") params.set("hall", hall);
        if (evangelist !== "all") params.set("evangelist", evangelist);
        if (assignedTo !== "all") params.set("assignedTo", assignedTo);
        params.set("page", String(targetPage));
        params.set("limit", "10");

        const res = await fetch(`/api/people?${params.toString()}`, {
          signal: controller.signal,
        });

        if (res.status === 401) {
          router.replace("/login?from=/dashboard/people");
          return;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || "Failed to load people");
        }

        const json: PeopleResponse = await res.json();
        setData(json);
        setPage(targetPage);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // Ignore aborted requests
        }
        setErrorMessage(
          err instanceof Error ? err.message : "An unexpected error occurred while fetching data."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [search, activeTab, status, hall, evangelist, assignedTo, router]
  );

  // When filters change: debounce search, reset to page 1, fetch
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      fetchPeople(1);
    }, 250);

    return () => clearTimeout(timer);
  }, [fetchPeople]);

  // Handle explicit page change (does not double fetch or snap back)
  const handlePageChange = (newPage: number) => {
    fetchPeople(newPage);
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const currentPageIds = data.people.map((p) => p._id);
    const isAllSelected =
      currentPageIds.length > 0 &&
      currentPageIds.every((id) => selectedIds.includes(id));

    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleResetFilters = () => {
    setSearch("");
    setActiveTab("all");
    setStatus("all");
    setHall("all");
    setEvangelist("all");
    setAssignedTo("all");
  };

  // Safe Server-side CSV Export
  const handleExport = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (activeTab !== "all") params.set("tab", activeTab);
      if (status !== "all") params.set("status", status);
      if (hall !== "all") params.set("hall", hall);
      if (evangelist !== "all") params.set("evangelist", evangelist);
      if (assignedTo !== "all") params.set("assignedTo", assignedTo);

      const res = await fetch(`/api/people/export?${params.toString()}`);
      if (res.status === 401) {
        router.replace("/login?from=/dashboard/people");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to export full dataset.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wcf-people-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Error exporting records."
      );
    } finally {
      setIsExporting(false);
    }
  };

  const openAssignModal = (mode: "assign" | "reassign") => {
    setAssignModalMode(mode);
    setIsAssignModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Follow-up Role KPI Header or Generic People Header */}
      {userRole === "follow_up" && data.followUpStats ? (
        <FollowUpMetricsHeader
          assignedCount={data.followUpStats.assigned}
          newCount={data.followUpStats.newCount}
          overdueCount={data.followUpStats.overdue}
        />
      ) : (
        <PeopleHeader
          userRole={userRole}
          totalCount={data.totalCount}
          onExport={handleExport}
          isExporting={isExporting}
        />
      )}

      {/* Error alert banner */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-rose-700 dark:text-rose-400 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="flex-1 font-medium">{errorMessage}</span>
          <button
            type="button"
            onClick={() => fetchPeople(page)}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <PeopleFilters
        userRole={userRole}
        search={search}
        onSearchChange={setSearch}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedStatus={status}
        onStatusChange={setStatus}
        selectedHall={hall}
        onHallChange={setHall}
        selectedEvangelist={evangelist}
        onEvangelistChange={setEvangelist}
        selectedAssignedTo={assignedTo}
        onAssignedToChange={setAssignedTo}
        halls={data.halls}
        evangelists={data.evangelistUsers}
        followUpUsers={data.followUpUsers}
        onResetFilters={handleResetFilters}
      />

      {/* Content Area */}
      {isLoading ? (
        <PeopleSkeleton />
      ) : data.people.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <EmptyUsersIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No people found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {search || activeTab !== "all" || status !== "all"
              ? "No records matched your search or filters. Try adjusting your query."
              : userRole === "evangelist"
              ? "You haven't recorded any evangelism contacts yet."
              : "No evangelized people have been recorded yet."}
          </p>
          {(search || activeTab !== "all" || status !== "all") && (
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <PeopleTable
            people={data.people}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            canManageAssignment={data.canManageAssignment}
          />

          {/* Mobile Card List View */}
          <PeopleCardList
            people={data.people}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            canManageAssignment={data.canManageAssignment}
          />

          {/* Pagination */}
          <PeoplePagination
            currentPage={data.page}
            totalPages={data.totalPages}
            totalCount={data.totalCount}
            currentCount={data.people.length}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Floating Action Bar for Selected Items */}
      {data.canManageAssignment && selectedIds.length > 0 && (
        <PeopleActionBar
          selectedCount={selectedIds.length}
          onOpenAssignModal={openAssignModal}
          onClearSelection={handleClearSelection}
        />
      )}

      {/* Assign / Reassign Modal */}
      <AssignModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        selectedIds={selectedIds}
        followUpUsers={data.followUpUsers}
        mode={assignModalMode}
        onSuccess={() => {
          setSelectedIds([]);
          fetchPeople(page);
        }}
      />
    </div>
  );
}
