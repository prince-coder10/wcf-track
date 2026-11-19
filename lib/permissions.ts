export const ROLES = ["unit_head", "executive", "evangelist", "follow_up"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSION_ACTIONS = {
  USERS_MANAGE: "users:manage",
  PEOPLE_READ_ALL: "people:read_all",
  PEOPLE_READ_OWN: "people:read_own",
  PEOPLE_READ_ASSIGNED: "people:read_assigned",
  PEOPLE_CREATE: "people:create",
  PEOPLE_ASSIGN: "people:assign",
  DASHBOARD_VIEW: "dashboard:view",
  EXPORT: "export",
  AUDIT_VIEW: "audit:view",
  CHECKIN_CREATE: "checkin:create",
} as const;

// What each role can do. Enforce this on the server in middleware.
export const PERMISSIONS = {
  unit_head: [
    PERMISSION_ACTIONS.USERS_MANAGE,
    PERMISSION_ACTIONS.PEOPLE_READ_ALL,
    PERMISSION_ACTIONS.PEOPLE_CREATE,
    PERMISSION_ACTIONS.PEOPLE_ASSIGN,
    PERMISSION_ACTIONS.DASHBOARD_VIEW,
    PERMISSION_ACTIONS.EXPORT,
    PERMISSION_ACTIONS.AUDIT_VIEW,
  ],
  executive: [
    PERMISSION_ACTIONS.PEOPLE_READ_ALL,
    PERMISSION_ACTIONS.PEOPLE_CREATE,
    PERMISSION_ACTIONS.PEOPLE_ASSIGN,
    PERMISSION_ACTIONS.DASHBOARD_VIEW,
    PERMISSION_ACTIONS.EXPORT,
  ],
  evangelist: [
    PERMISSION_ACTIONS.PEOPLE_CREATE,
    PERMISSION_ACTIONS.PEOPLE_READ_OWN,
  ],
  follow_up: [
    PERMISSION_ACTIONS.PEOPLE_READ_ASSIGNED,
    PERMISSION_ACTIONS.CHECKIN_CREATE,
  ],
} as const;

export type PermissionAction =
  | (typeof PERMISSION_ACTIONS)[keyof typeof PERMISSION_ACTIONS]
  | string;

/**
 * Returns the default landing page for a user based on their role and permissions.
 * - unit_head & executive: have "dashboard:view" -> "/dashboard"
 * - evangelist & follow_up: do NOT have dashboard:view -> "/dashboard/people"
 */
export function getDefaultRouteForRole(role: Role): string {
  const allowed = PERMISSIONS[role] as readonly string[];
  if (allowed.includes(PERMISSION_ACTIONS.DASHBOARD_VIEW)) {
    return "/dashboard";
  }
  return "/dashboard/people";
}

/**
 * Helper to check if a role is allowed to access a given permission action
 */
export function roleHasPermission(
  role: Role,
  action: string,
  canManageUsers: boolean = false
): boolean {
  if (action === PERMISSION_ACTIONS.USERS_MANAGE && role === "executive") {
    return canManageUsers;
  }
  const allowed = PERMISSIONS[role] as readonly string[] | undefined;
  return allowed ? allowed.includes(action) : false;
}

export interface RoleMeta {
  role: Role;
  label: string;
  shortDescription: string;
  badgeClass: string;
}

export const ROLE_CONFIG: Record<Role, RoleMeta> = {
  unit_head: {
    role: "unit_head",
    label: "Unit Head",
    shortDescription: "Accounts, roles, assignment, audit log",
    badgeClass: "bg-gray-900 text-white border-transparent",
  },
  executive: {
    role: "executive",
    label: "Executive",
    shortDescription: "Dashboard, all people, reassign, export",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  evangelist: {
    role: "evangelist",
    label: "Evangelist",
    shortDescription: "Adds and edits own entries only",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  follow_up: {
    role: "follow_up",
    label: "Follow-up member",
    shortDescription: "Sees assigned people, logs check-ins",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

