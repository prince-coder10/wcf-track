"use client";

import { useState } from "react";
import {
  UserPlus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Copy,
  Check,
} from "lucide-react";
import { ROLE_CONFIG, Role } from "@/lib/permissions";
import { CreatedInviteInfo, UNITS, UserItem } from "../types";

interface CreateUserCardProps {
  onUserCreated: (user: UserItem, invite: CreatedInviteInfo) => void;
  createdInvite: CreatedInviteInfo | null;
}

export default function CreateUserCard({
  onUserCreated,
  createdInvite,
}: CreateUserCardProps) {
  const [fullName, setFullName] = useState("");
  const [login, setLogin] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("follow_up");
  const [unit, setUnit] = useState("Follow-up");
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          login,
          phone,
          role,
          unit,
          canManageUsers: role === "executive" ? canManageUsers : false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create account");
        return;
      }

      onUserCreated(data.user, {
        url: data.inviteUrl,
        login: data.user.login,
        name: data.user.fullName,
        expiresAt: data.expiresAt,
      });

      // Reset form
      setFullName("");
      setLogin("");
      setPhone("");
      setRole("follow_up");
      setCanManageUsers(false);
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteUrl = () => {
    if (!createdInvite) return;
    navigator.clipboard.writeText(createdInvite.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
            Create account
          </h2>
          <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
            Admin action
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Add a new worker or team member to Evangelism &amp; Follow-up.
        </p>
      </div>

      {/* Success Invite Alert with Copy Button */}
      {createdInvite && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2.5 animate-fade-in">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-emerald-900">
                One-time invite link ready!
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Send this 24-hour setup link to{" "}
                <strong className="font-semibold">{createdInvite.name}</strong> ({createdInvite.login}):
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-emerald-200">
            <input
              type="text"
              readOnly
              value={createdInvite.url}
              className="flex-1 text-xs text-gray-700 bg-transparent px-1.5 outline-none font-mono truncate"
            />
            <button
              type="button"
              onClick={copyInviteUrl}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-[#c83226] text-white hover:bg-[#b02b20] transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check size={12} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={12} /> Copy
                </>
              )}
            </button>
          </div>

          <p className="text-[10px] text-emerald-600">
            Link expires in 24 hours. The recipient creates their own password safely.
          </p>
        </div>
      )}

      {/* Error Message */}
      {formError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-red-700 text-xs">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleCreateUser} className="space-y-4" noValidate>
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Full name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Samuel Kalu"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent text-sm transition-all"
          />
        </div>

        {/* Email or Username */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Email or username
          </label>
          <input
            type="text"
            required
            placeholder="e.g. samuel.k or samuel@wcf.org"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent text-sm transition-all"
          />
        </div>

        {/* Phone (Optional) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Phone number <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="tel"
            placeholder="e.g. 08012345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent text-sm transition-all"
          />
        </div>

        {/* Role Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Role
          </label>
          <div className="relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-lg border border-gray-200 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent text-sm font-medium transition-all"
            >
              <option value="follow_up">Follow-up member</option>
              <option value="evangelist">Evangelist</option>
              <option value="executive">Executive</option>
              <option value="unit_head">Unit Head</option>
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
            />
          </div>
          <p className="text-[11px] text-gray-400">
            {ROLE_CONFIG[role]?.shortDescription}
          </p>
        </div>

        {/* Executive Delegation Option */}
        {role === "executive" && (
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={canManageUsers}
                onChange={(e) => setCanManageUsers(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-[#c83226] focus:ring-[#c83226]"
              />
              <div>
                <span className="text-xs font-semibold text-gray-800 block">
                  Allow managing users &amp; roles
                </span>
                <span className="text-[11px] text-gray-500 block leading-tight">
                  Delegates account creation, editing, and deactivation rights to this executive.
                </span>
              </div>
            </label>
          </div>
        )}

        {/* Unit Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Unit / Department
          </label>
          <div className="relative">
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-lg border border-gray-200 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#c83226] focus:border-transparent text-sm font-medium transition-all"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
            />
          </div>
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-[#c83226] hover:bg-[#b02b20] active:bg-[#9c251b] disabled:bg-gray-300 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              <UserPlus size={16} />
              Create and send one-time link
            </>
          )}
        </button>

        {/* Explanatory Footer Text */}
        <p className="text-[11px] text-gray-400 leading-relaxed text-center sm:text-left">
          The person sets their own password from a one-time link that
          expires after 24 hours. You never see or share a password.
        </p>
      </form>
    </div>
  );
}
