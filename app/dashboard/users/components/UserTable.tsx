"use client";

import { Users } from "lucide-react";
import { ROLE_CONFIG } from "@/lib/permissions";
import { UserItem } from "../types";

interface UserTableProps {
  users: UserItem[];
  currentUserId?: string;
  actionLoadingId: string | null;
  onEdit: (user: UserItem) => void;
  onToggleStatus: (user: UserItem) => void;
  onResendInvite: (user: UserItem) => void;
  formatLastLogin: (dateStr: string | null, status: string) => string;
}

export default function UserTable({
  users,
  currentUserId,
  actionLoadingId,
  onEdit,
  onToggleStatus,
  onResendInvite,
  formatLastLogin,
}: UserTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <th className="py-3 px-4">User</th>
            <th className="py-3 px-4">Role</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Last login</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-12 text-center text-gray-400">
                <Users size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="font-medium text-gray-600">No users found</p>
                <p className="text-xs text-gray-400 mt-1">
                  Try adjusting your search query or role filter.
                </p>
              </td>
            </tr>
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
                <tr
                  key={u.id}
                  className="hover:bg-gray-50/80 transition-colors"
                >
                  {/* User info */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-semibold text-xs text-gray-700 shrink-0">
                        {(u.fullName || "User")
                          .split(" ")
                          .filter(Boolean)
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 flex items-center gap-1.5">
                          <span className="truncate">{u.fullName}</span>
                          {isCurrentUser && (
                            <span className="text-[10px] bg-red-50 text-[#c83226] font-semibold px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {u.login}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleMeta.badgeClass}`}
                    >
                      {roleMeta.label}
                    </span>
                    {u.role === "executive" && u.permissions?.canManageUsers && (
                      <span className="block text-[10px] text-gray-400 mt-0.5 font-medium">
                        + User manager
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {u.status === "active" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </span>
                    )}
                    {u.status === "invited" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Invited
                      </span>
                    )}
                    {u.status === "deactivated" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                        Deactivated
                      </span>
                    )}
                  </td>

                  {/* Last Login */}
                  <td className="py-3 px-4 whitespace-nowrap text-xs text-gray-500">
                    {formatLastLogin(u.lastLoginAt, u.status)}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => onResendInvite(u)}
                          disabled={actionLoadingId === u.id}
                          className="text-xs font-medium text-amber-700 hover:bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          Invite link
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => onEdit(u)}
                        className="text-xs font-medium text-gray-700 hover:bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Edit
                      </button>

                      {!isCurrentUser ? (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(u)}
                          disabled={actionLoadingId === u.id}
                          className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                            isDeactivated
                              ? "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                              : "text-red-600 border-gray-200 hover:bg-red-50 hover:border-red-200"
                          }`}
                        >
                          {isDeactivated ? "Reactivate" : "Deactivate"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300 px-2">
                          Current
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
