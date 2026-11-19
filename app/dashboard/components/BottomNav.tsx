"use client";

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

interface TabItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  requiredPermission?: string;
}

const tabs: TabItem[] = [
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
  },
  {
    label: "Absentees",
    href: "/dashboard/absentees",
    icon: UserX,
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: UserCog,
    requiredPermission: PERMISSION_ACTIONS.USERS_MANAGE,
  },
  {
    label: "Activity",
    href: "/dashboard/activity",
    icon: ClipboardList,
    requiredPermission: PERMISSION_ACTIONS.AUDIT_VIEW,
  },
];

export default function BottomNav({ userRole }: { userRole?: Role }) {
  const pathname = usePathname();

  const visibleTabs = tabs.filter((item) => {
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
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex">
        {visibleTabs.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                active ? "text-[#c83226]" : "text-gray-400"
              }`}
            >
              <Icon size={20} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
