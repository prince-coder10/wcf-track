"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  MessageSquare,
  Phone,
  Search,
  Calendar,
  CheckCircle,
  X,
  Sparkles,
} from "lucide-react";

interface AbsenteeMemberItem {
  _id: string;
  fullName: string;
  phone: string;
  phoneNormalized: string;
  hostel: string;
  roomOrBlock?: string | null;
  unit?: string | null;
  newMember: boolean;
  event: string;
  sessionDate: string;
  lastCheckInDate: string;
  daysSinceLastAttended: number | null;
  assignedTo?: { _id: string; fullName: string } | null;
  status: string;
  checkInCount: number;
  lastContactAt?: string | null;
  notes?: string | null;
}

interface AbsenteesClientProps {
  initialData: {
    members: AbsenteeMemberItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  followUpUsers: Array<{ _id: string; fullName: string }>;
  canManageAssignment: boolean;
  userRole: string;
  currentFilters: {
    search: string;
    event: string;
    status: string;
    newMemberOnly: boolean;
    page: number;
  };
}

export default function AbsenteesClient({
  initialData,
  followUpUsers,
  canManageAssignment,
  currentFilters,
}: AbsenteesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(currentFilters.search);
  const [selectedEvent, setSelectedEvent] = useState(currentFilters.event);
  const [selectedStatus, setSelectedStatus] = useState(currentFilters.status);
  const [newMemberOnly, setNewMemberOnly] = useState(currentFilters.newMemberOnly);

  // Check-in modal state
  const [activeCheckInMember, setActiveCheckInMember] = useState<AbsenteeMemberItem | null>(null);
  const [checkInMethod, setCheckInMethod] = useState<"whatsapp" | "call" | "visit">("whatsapp");
  const [reached, setReached] = useState<boolean>(true);
  const [notes, setNotes] = useState("");
  const [newStatus, setNewStatus] = useState<string>("contacted");
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);

  // Assignment selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  const applyFilters = (updates: Partial<typeof currentFilters>) => {
    const params = new URLSearchParams();
    const s = updates.search !== undefined ? updates.search : search;
    const ev = updates.event !== undefined ? updates.event : selectedEvent;
    const st = updates.status !== undefined ? updates.status : selectedStatus;
    const nm = updates.newMemberOnly !== undefined ? updates.newMemberOnly : newMemberOnly;

    if (s) params.set("search", s);
    if (ev && ev !== "all") params.set("event", ev);
    if (st && st !== "all") params.set("status", st);
    if (nm) params.set("newMemberOnly", "true");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search });
  };

  const formatEventName = (ev: string) => {
    switch (ev) {
      case "prayer_meeting":
        return "Monday Prayer";
      case "fjc":
        return "Tuesday FJC";
      case "bible_study":
        return "Thursday Bible Study";
      case "sunday_service":
        return "Sunday Main Service";
      default:
        return ev.replace(/_/g, " ");
    }
  };

  const getWhatsAppUrl = (rawPhone: string) => {
    const clean = rawPhone.replace(/[^\d]/g, "");
    const formatted = clean.startsWith("0") ? `234${clean.slice(1)}` : clean;
    return `https://wa.me/${formatted}`;
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchAssign = async () => {
    if (!assigneeId && assigneeId !== "unassign") return;
    if (selectedIds.length === 0) return;

    setIsAssigning(true);
    try {
      const res = await fetch("/api/absentees/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberIds: selectedIds,
          assignedTo: assigneeId === "unassign" ? null : assigneeId,
        }),
      });

      if (res.ok) {
        setSelectedIds([]);
        router.refresh();
      }
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSaveCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCheckInMember) return;

    setIsSubmittingCheckIn(true);
    try {
      const res = await fetch(`/api/absentees/${activeCheckInMember._id}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: checkInMethod,
          reached,
          notes,
          status: newStatus,
        }),
      });

      if (res.ok) {
        setActiveCheckInMember(null);
        setNotes("");
        router.refresh();
      }
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Absentee Members
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Fellowship members needing follow-up from missed services
          </p>
        </div>

        {canManageAssignment && selectedIds.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-2xl">
            <span className="text-xs font-bold text-blue-900 pl-2">
              {selectedIds.length} selected
            </span>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-xl border border-blue-300 bg-white font-medium text-slate-700 focus:outline-none"
            >
              <option value="">Assign to...</option>
              <option value="unassign">Unassign</option>
              {followUpUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.fullName}
                </option>
              ))}
            </select>
            <button
              onClick={handleBatchAssign}
              disabled={isAssigning || !assigneeId}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {isAssigning ? "Saving..." : "Apply"}
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member, phone, or hostel"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </form>

        <select
          value={selectedEvent}
          onChange={(e) => {
            setSelectedEvent(e.target.value);
            applyFilters({ event: e.target.value });
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none cursor-pointer"
        >
          <option value="">All Services</option>
          <option value="sunday_service">Sunday Main Service</option>
          <option value="bible_study">Thursday Bible Study</option>
          <option value="prayer_meeting">Monday Prayer</option>
          <option value="fjc">Tuesday FJC</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            applyFilters({ status: e.target.value });
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="resolved">Resolved</option>
          <option value="unreachable">Unreachable</option>
        </select>

        <button
          type="button"
          onClick={() => {
            const next = !newMemberOnly;
            setNewMemberOnly(next);
            applyFilters({ newMemberOnly: next });
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition border ${
            newMemberOnly
              ? "bg-amber-500 text-white border-amber-600 shadow-sm"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Freshers / New</span>
        </button>
      </div>

      {/* Cards Grid */}
      {initialData.members.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500">
          No absentee members found matching this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialData.members.map((member) => {
            const isSelected = selectedIds.includes(member._id);

            return (
              <div
                key={member._id}
                className={`bg-white rounded-3xl p-5 border transition shadow-sm flex flex-col justify-between ${
                  isSelected
                    ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10"
                    : "border-slate-200"
                }`}
              >
                <div>
                  {/* Top: Name, Badge, Select */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {canManageAssignment && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(member._id)}
                          className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-base text-slate-900 truncate">
                            {member.fullName}
                          </h3>
                          {member.newMember && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Fresher
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {member.hostel}
                          {member.roomOrBlock ? ` · ${member.roomOrBlock}` : ""}
                          {member.unit ? ` · ${member.unit}` : ""}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                        member.status === "contacted"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : member.status === "resolved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : member.status === "unreachable"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {member.status}
                    </span>
                  </div>

                  {/* Attendance Stats */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Missed: <strong className="text-slate-800">{formatEventName(member.event)}</strong>
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-semibold">
                      <span
                        className={
                          member.daysSinceLastAttended && member.daysSinceLastAttended >= 14
                            ? "text-[#b91c1c]"
                            : "text-amber-700"
                        }
                      >
                        {member.daysSinceLastAttended !== null
                          ? `Last attended ${member.daysSinceLastAttended}d ago`
                          : "No previous attendance"}
                      </span>
                      <span className="text-slate-400 font-normal">
                        {member.checkInCount} check-in{member.checkInCount === 1 ? "" : "s"}
                      </span>
                    </div>

                    {member.assignedTo && (
                      <div className="text-[11px] text-slate-500 pt-1">
                        Assigned to: <strong className="text-slate-700">{member.assignedTo.fullName}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons: WhatsApp, Call, Log Check-in */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
                  <a
                    href={getWhatsAppUrl(member.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold bg-[#15803d] text-white hover:bg-[#166534] transition shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${member.phone}`}
                    className="inline-flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 transition shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                    <span>Call</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveCheckInMember(member);
                      setNewStatus(member.status === "pending" ? "contacted" : member.status);
                    }}
                    className="inline-flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold bg-[#c2410c] text-white hover:bg-[#9a3412] transition shadow-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Log</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Check-in Modal */}
      {activeCheckInMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  Log Check-in
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {activeCheckInMember.fullName} · {activeCheckInMember.hostel}
                </p>
              </div>
              <button
                onClick={() => setActiveCheckInMember(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCheckIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  How did you reach out?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["whatsapp", "call", "visit"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCheckInMethod(m)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition border ${
                        checkInMethod === m
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Did you reach them?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReached(true);
                      setNewStatus("contacted");
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                      reached
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReached(false);
                      setNewStatus("unreachable");
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                      !reached
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    No answer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted (In conversation)</option>
                  <option value="resolved">Resolved (Attending next service)</option>
                  <option value="unreachable">Unreachable (No response)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Follow-up Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Has exams this week, confirmed will be at Thursday Bible Study..."
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCheckInMember(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCheckIn}
                  className="flex-1 py-2.5 rounded-xl bg-[#c2410c] hover:bg-[#9a3412] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  {isSubmittingCheckIn ? "Saving..." : "Save check-in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
