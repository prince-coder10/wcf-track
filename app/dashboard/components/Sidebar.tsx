"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCog,
  ClipboardList,
  UserX,
} from "lucide-react";
import { Role, roleHasPermission, PERMISSION_ACTIONS } from "@/lib/permissions";
import NotificationBell from "@/app/components/NotificationBell";
import LogoutButton from "@/app/components/LogoutButton";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  requiredPermission?: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    requiredPermission: PERMISSION_ACTIONS.DASHBOARD_VIEW,
  },
  {
    label: "People",
    href: "/dashboard/people",
    icon: Users,
    // Everyone has people access (read_all, read_own, or read_assigned)
  },
  {
    label: "Absentees",
    href: "/dashboard/absentees",
    icon: UserX,
    // Visible to unit_head, executive, and follow_up
  },
  {
    label: "Users & roles",
    href: "/dashboard/users",
    icon: UserCog,
    requiredPermission: PERMISSION_ACTIONS.USERS_MANAGE,
  },
  {
    label: "Activity log",
    href: "/dashboard/activity",
    icon: ClipboardList,
    requiredPermission: PERMISSION_ACTIONS.AUDIT_VIEW,
  },
];

export default function Sidebar({ userRole }: { userRole?: Role }) {
  const pathname = usePathname();

  // Filter navigation items by role permissions
  const visibleNavItems = navItems.filter((item) => {
    if (item.href === "/dashboard/absentees") {
      return (
        userRole === "unit_head" ||
        userRole === "executive" ||
        userRole === "follow_up"
      );
    }
    if (!item.requiredPermission) return true;
    if (!userRole) return false;
    return roleHasPermission(userRole, item.requiredPermission);
  });

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 min-h-screen bg-white border-r border-gray-100">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
            <Image
              src="/logos/logo-192.png"
              alt="WCF Logo"
              width={36}
              height={36}
              className="object-cover scale-105"
            />
          </div>
          <span className="text-sm font-semibold text-gray-800 leading-tight">
            Evangelism &amp;<br />Follow-up
          </span>
        </div>
        <NotificationBell />
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleNavItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <Icon size={16} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 border-t border-gray-100 pt-3">
        <LogoutButton variant="desktop" />
      </div>
    </aside>
  );
}
