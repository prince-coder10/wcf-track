import { ROLE_CONFIG, ROLES } from "@/lib/permissions";
import { UserItem } from "../types";

interface RoleGuideGridProps {
  users: UserItem[];
}

export default function RoleGuideGrid({ users }: RoleGuideGridProps) {
  return (
    <section className="pt-2">
      <div className="mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Role Reference &amp; Permissions Guide
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {ROLES.map((r) => {
          const conf = ROLE_CONFIG[r];
          return (
            <div
              key={r}
              className="bg-white rounded-xl border border-gray-100 p-4 shadow-2xs flex flex-col justify-between space-y-2 hover:border-gray-200 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${conf.badgeClass}`}
                  >
                    {conf.label}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {conf.shortDescription}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
                <span>
                  {users.filter((u) => u.role === r && u.status === "active").length} active
                </span>
                <span className="font-mono text-[10px] text-gray-300 uppercase">
                  {r}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-gray-400 mt-2">
        Roles and permissions reflect current fellowship structure.
      </p>
    </section>
  );
}
