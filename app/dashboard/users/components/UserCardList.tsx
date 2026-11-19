"use client";

import { Users, ExternalLink, Edit3, UserCheck, UserX } from "lucide-react";
import { ROLE_CONFIG } from "@/lib/permissions";
import { UserItem } from "../types";

interface UserCardListProps {
  users: UserItem[];
  currentUserId?: string;
  actionLoadingId: string | null;
  onEdit: (user: UserItem) => void;
  onToggleStatus: (user: UserItem) => void;
  onResendInvite: (user: UserItem) => void;
  formatLastLogin: (dateStr: string | null, status: string) => string;
}

export default function UserCardList({
  users,
  currentUserId,
  actionLoadingId,
  onEdit,
  onToggleStatus,
  onResendInvite,
  formatLastLogin,
}: UserCardListProps) {
  return (
    <div className="md:hidden divide-y divide-gray-100">
      {users.length === 0 ? (
        <div className="py-12 px-4 text-center text-gray-400">
          <Users size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="font-medium text-gray-600">No users found</p>
          <p className="text-xs text-gray-400 mt-1">
            Try adjusting your search query or role filter.
          </p>
        </div>
      ) : (
        users.map((u) => {
          const roleMeta = ROLE_CONFIG[u.role] || {
            label: u.role,
            badgeClass: "bg-gray-100 text-gray-700",
          };
          const isCurrentUser = u.id === currentUserId;
          const isPending = u.status === "invited";
          const isDeactivated = u.status === "deactivated";

          return (
            <div
              key={u.id}
              className="p-4 space-y-3 hover:bg-gray-50/50 transition-colors"
            >
              {/* Top Row: User Avatar & Name & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-semibold text-sm text-gray-700 shrink-0">
                    {(u.fullName || "User")
                      .split(" ")
                      .filter(Boolean)
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 flex items-center gap-1.5 truncate">
                      <span className="truncate">{u.fullName}</span>
                      {isCurrentUser && (
                        <span className="text-[10px] bg-red-50 text-[#c83226] font-semibold px-1.5 py-0.5 rounded shrink-0">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {u.login}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="shrink-0">
                  {u.status === "active" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Active
                    </span>
                  )}
                  {u.status === "invited" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Invited
                    </span>
                  )}
                  {u.status === "deactivated" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                      Deactivated
                    </span>
                  )}
                </div>
              </div>

              {/* Meta Info: Role, Unit, Last Active */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/70 p-2.5 rounded-lg border border-gray-100">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                    Role
                  </span>
                  <span
                    className={`inline-block mt-0.5 px-2 py-0.5 rounded-md font-medium text-[11px] border ${roleMeta.badgeClass}`}
                  >
                    {roleMeta.label}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">
                    Last Active
                  </span>
                  <span className="text-gray-700 font-medium mt-0.5 inline-block">
                    {formatLastLogin(u.lastLoginAt, u.status)}
                  </span>
                </div>
                {u.unit && (
                  <div className="col-span-2 pt-1 border-t border-gray-200/50 flex items-center justify-between">
                    <span className="text-gray-400 text-[11px]">Unit / Fellowship:</span>
                    <span className="text-gray-700 font-medium text-[11px]">{u.unit}</span>
                  </div>
                )}
              </div>

              {/* Touch-Friendly Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {isPending && (
                  <button
                    type="button"
                    onClick={() => onResendInvite(u)}
                    disabled={actionLoadingId === u.id}
                    className="flex-1 min-h-[42px] text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center gap-1 active:bg-amber-100 transition-colors"
                  >
                    <ExternalLink size={13} />
                    Invite link
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onEdit(u)}
                  className="flex-1 min-h-[42px] text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg flex items-center justify-center gap-1 active:bg-gray-100 transition-colors shadow-2xs"
                >
                  <Edit3 size={13} />
                  Edit
                </button>
                {!isCurrentUser ? (
                  <button
                    type="button"
                    onClick={() => onToggleStatus(u)}
                    disabled={actionLoadingId === u.id}
                    className={`flex-1 min-h-[42px] text-xs font-semibold rounded-lg flex items-center justify-center gap-1 border transition-colors shadow-2xs ${
                      isDeactivated
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200 active:bg-emerald-100"
                        : "text-red-600 bg-white border-gray-200 hover:bg-red-50 hover:border-red-200 active:bg-red-100"
                    }`}
                  >
                    {isDeactivated ? (
                      <>
                        <UserCheck size={13} /> Reactivate
                      </>
                    ) : (
                      <>
                        <UserX size={13} /> Deactivate
                      </>
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
