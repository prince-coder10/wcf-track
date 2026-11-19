"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { UserItem, CreatedInviteInfo, MobileTab } from "./types";
import UsersHeader from "./components/UsersHeader";
import UserFilters from "./components/UserFilters";
import UserTable from "./components/UserTable";
import UserCardList from "./components/UserCardList";
import CreateUserCard from "./components/CreateUserCard";
import EditUserModal from "./components/EditUserModal";
import RoleGuideGrid from "./components/RoleGuideGrid";

export type { UserItem };

interface UsersClientProps {
  initialUsers: UserItem[];
  currentUserId?: string;
  currentUserRole?: string;
}

export default function UsersClient({
  initialUsers,
  currentUserId,
}: UsersClientProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [mobileTab, setMobileTab] = useState<MobileTab>("list");

  // Invite & Edit states
  const [createdInvite, setCreatedInvite] = useState<CreatedInviteInfo | null>(null);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.login.toLowerCase().includes(search.toLowerCase()) ||
        (u.phone && u.phone.includes(search));
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchStatus = statusFilter === "all" || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // Overall counts
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === "active").length,
      invited: users.filter((u) => u.status === "invited").length,
      deactivated: users.filter((u) => u.status === "deactivated").length,
    };
  }, [users]);

  // Format relative login time
  const formatLastLogin = (dateStr: string | null, status: string) => {
    if (status === "invited") return "Pending invite";
    if (!dateStr) return "Never";

    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  // Handle created user from CreateUserCard
  const handleUserCreated = (newUser: UserItem, invite: CreatedInviteInfo) => {
    setUsers((prev) => [newUser, ...prev]);
    setCreatedInvite(invite);
    showToast(`Account for ${newUser.fullName} created successfully!`);
  };

  // Toggle user status (Deactivate / Reactivate)
  const handleToggleStatus = async (user: UserItem) => {
    if (user.id === currentUserId && user.status === "active") {
      showToast("You cannot deactivate your own account.", "error");
      return;
    }

    const nextStatus = user.status === "deactivated" ? "active" : "deactivated";
    setActionLoadingId(user.id);

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to update user status", "error");
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
      );
      showToast(
        `${user.fullName} has been ${
          nextStatus === "active" ? "reactivated" : "deactivated"
        }.`
      );
    } catch {
      showToast("Error updating account status", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Generate / Resend fresh invite link
  const handleResendInvite = async (user: UserItem) => {
    setActionLoadingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend_invite" }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to generate invite", "error");
        return;
      }

      setCreatedInvite({
        url: data.inviteUrl,
        login: user.login,
        name: user.fullName,
        expiresAt: data.expiresAt,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, status: "invited", hasPendingInvite: true } : u
        )
      );

      setMobileTab("create");
      showToast(`Fresh one-time link generated for ${user.fullName}`);
    } catch {
      showToast("Failed to generate invite link", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Save updated user from EditUserModal
  const handleUserSaved = (updatedUser: UserItem) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    );
    showToast("User updated successfully");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-50 p-3.5 rounded-xl shadow-lg border flex items-center gap-3 animate-fade-in ${
            toastMessage.type === "success"
              ? "bg-gray-900 text-white border-gray-800"
              : "bg-red-600 text-white border-red-700"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-white shrink-0" />
          )}
          <span className="text-sm font-medium">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-auto text-gray-400 hover:text-white p-1"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Page Header & Mobile Tab Switcher */}
      <UsersHeader
        totalCount={filteredUsers.length}
        mobileTab={mobileTab}
        onTabChange={setMobileTab}
      />

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / MAIN COLUMN: Users Directory (Table on md+, Cards on mobile) */}
        <section
          className={`lg:col-span-7 xl:col-span-8 flex flex-col gap-4 ${
            mobileTab === "create" ? "hidden md:flex" : "flex"
          }`}
        >
          <UserFilters
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            stats={stats}
          />

          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <UserTable
              users={filteredUsers}
              currentUserId={currentUserId}
              actionLoadingId={actionLoadingId}
              onEdit={setEditingUser}
              onToggleStatus={handleToggleStatus}
              onResendInvite={handleResendInvite}
              formatLastLogin={formatLastLogin}
            />

            <UserCardList
              users={filteredUsers}
              currentUserId={currentUserId}
              actionLoadingId={actionLoadingId}
              onEdit={setEditingUser}
              onToggleStatus={handleToggleStatus}
              onResendInvite={handleResendInvite}
              formatLastLogin={formatLastLogin}
            />
          </div>
        </section>

        {/* RIGHT COLUMN: Create Account Form */}
        <section
          className={`lg:col-span-5 xl:col-span-4 lg:sticky lg:top-6 ${
            mobileTab === "list" ? "hidden md:block" : "block"
          }`}
        >
          <CreateUserCard
            onUserCreated={handleUserCreated}
            createdInvite={createdInvite}
          />
        </section>
      </div>

      {/* Role Descriptions & Guide */}
      <RoleGuideGrid users={users} />

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUserSaved={handleUserSaved}
        />
      )}
    </div>
  );
}
