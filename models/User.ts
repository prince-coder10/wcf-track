import mongoose, { Schema, model, models, Document, Types } from "mongoose";
import {
  ROLES,
  Role,
  PERMISSIONS,
  PERMISSION_ACTIONS,
  PermissionAction,
} from "@/lib/permissions";

export { ROLES, PERMISSIONS, PERMISSION_ACTIONS };
export type { Role, PermissionAction };

export interface IUserMethods {
  can(action: PermissionAction): boolean;
}

export interface IUser extends Document, IUserMethods {
  fullName: string;
  login: string;
  phone?: string;
  unit?: string;
  passwordHash?: string;
  role: Role;
  permissions: {
    canManageUsers: boolean;
  };
  status: "invited" | "active" | "deactivated";
  invite?: {
    tokenHash?: string;
    purpose?: "invite" | "reset";
    expiresAt?: Date;
    usedAt?: Date;
  };
  createdBy?: Types.ObjectId;
  lastLoginAt?: Date;
  deactivatedAt?: Date;
  deactivatedBy?: Types.ObjectId;
  failedLogins: number;
  lockedUntil?: Date;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export type UserModel = mongoose.Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    fullName: { type: String, required: true, trim: true },

    // email or username, as on the Create account form
    login: { type: String, required: true, unique: true, lowercase: true, trim: true },

    phone: { type: String, trim: true },

    unit: { type: String, trim: true, default: "Follow-up" },

    // null until the person accepts their invite
    passwordHash: { type: String, select: false },

    role: { type: String, enum: ROLES, required: true, index: true },

    // Optional delegation: the unit head can let a specific executive manage
    // accounts. Only meaningful when role === "executive".
    permissions: {
      canManageUsers: { type: Boolean, default: false },
    },

    status: {
      type: String,
      enum: ["invited", "active", "deactivated"],
      default: "invited",
      index: true,
    },

    // one-time link for invites and password resets (store a hash, never the token)
    invite: {
      tokenHash: { type: String, select: false },
      purpose: { type: String, enum: ["invite", "reset"] },
      expiresAt: Date,
      usedAt: Date,
    },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" }, // empty only for the seeded unit head
    lastLoginAt: Date,
    deactivatedAt: Date,
    deactivatedBy: { type: Schema.Types.ObjectId, ref: "User" },

    // lockout after repeated failed logins
    failedLogins: { type: Number, default: 0 },
    lockedUntil: Date,

    // increment to sign the user out of every session at once
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Delegation only applies to executives
userSchema.pre("validate", function () {
  if (this.role !== "executive") {
    if (!this.permissions) {
      this.permissions = { canManageUsers: false };
    } else {
      this.permissions.canManageUsers = false;
    }
  }

  if (this.role !== "unit_head" && !this.createdBy) {
    this.invalidate(
      "createdBy",
      "Every account except the first unit head needs a creator"
    );
  }
});

// Single place to ask "is this user allowed to do X?"
userSchema.methods.can = function (action: string) {
  if (this.status !== "active") return false;
  if (action === PERMISSION_ACTIONS.USERS_MANAGE && this.role === "executive") {
    return this.permissions?.canManageUsers === true;
  }
  const allowedActions = PERMISSIONS[this.role as Role] as readonly string[] | undefined;
  return allowedActions ? allowedActions.includes(action) : false;
};

export default (models.User as UserModel) ||
  model<IUser, UserModel>("User", userSchema);
