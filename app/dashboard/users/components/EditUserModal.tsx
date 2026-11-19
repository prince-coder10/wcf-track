"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { Role } from "@/lib/permissions";
import { UNITS, UserItem } from "../types";

interface EditUserModalProps {
  user: UserItem;
  onClose: () => void;
  onUserSaved: (updatedUser: UserItem) => void;
}

export default function EditUserModal({
  user,
  onClose,
  onUserSaved,
}: EditUserModalProps) {
  const [fullName, setFullName] = useState(user.fullName);
  const [login, setLogin] = useState(user.login);
  const [phone, setPhone] = useState(user.phone || "");
  const [role, setRole] = useState<Role>(user.role);
  const [unit, setUnit] = useState(user.unit || "Follow-up");
  const [canManage, setCanManage] = useState(
    user.permissions?.canManageUsers || false
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          login,
          phone,
          role,
          unit,
          canManageUsers: role === "executive" ? canManage : false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Failed to update user");
        return;
      }

      onUserSaved(data.user);
      onClose();
    } catch {
      setEditError("Network error. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-gray-100 shadow-xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Edit account</h3>
            <p className="text-xs text-gray-400">
              Update role, details, or access permissions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {editError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{editError}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 uppercase">
              Full name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c83226] text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 uppercase">
              Email or username
            </label>
            <input
              type="text"
              required
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c83226] text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 uppercase">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c83226] text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 uppercase">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#c83226] text-sm font-medium"
            >
              <option value="follow_up">Follow-up member</option>
              <option value="evangelist">Evangelist</option>
              <option value="executive">Executive</option>
              <option value="unit_head">Unit Head</option>
            </select>
          </div>

          {role === "executive" && (
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canManage}
                  onChange={(e) => setCanManage(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-[#c83226] focus:ring-[#c83226]"
                />
                <div>
                  <span className="text-xs font-semibold text-gray-800 block">
                    Allow managing users &amp; roles
                  </span>
                  <span className="text-[11px] text-gray-500 block">
                    Delegates account creation and permissions management.
                  </span>
                </div>
              </label>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700 uppercase">
              Unit / Department
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#c83226] text-sm font-medium"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2.5 bg-[#c83226] hover:bg-[#b02b20] disabled:bg-gray-300 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              {isUpdating ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
