import { Role } from "@/lib/permissions";

export interface UserItem {
  id: string;
  fullName: string;
  login: string;
  phone?: string;
  unit?: string;
  role: Role;
  status: "invited" | "active" | "deactivated";
  permissions?: {
    canManageUsers: boolean;
  };
  lastLoginAt: string | null;
  createdAt: string | null;
  hasPendingInvite?: boolean;
}

export interface CreatedInviteInfo {
  url: string;
  login: string;
  name: string;
  expiresAt: string;
}

export type MobileTab = "list" | "create";

export const UNITS = [
  "Follow-up",
  "Evangelism",
  "Executive & Leadership",
  "Prayer & Intercession",
  "Media & Technical",
  "Ushering & Protocol",
] as const;
