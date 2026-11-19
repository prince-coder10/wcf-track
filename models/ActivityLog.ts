import mongoose, { Document, Schema, Types } from "mongoose";
import { Role } from "@/lib/permissions";

export const ACTIVITY_ACTIONS = [
  "viewed",
  "check_in",
  "reassigned",
  "created",
  "edited",
  "exported",
  "account",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const ACTIVITY_TARGET_TYPES = ["person", "user", "export", "system"] as const;
export type ActivityTargetType = (typeof ACTIVITY_TARGET_TYPES)[number];

export interface IActivityLog extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  userName: string;
  userRole: Role;
  action: ActivityAction;
  targetType: ActivityTargetType;
  targetId?: Types.ObjectId;
  targetLabel: string;
  details: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: ACTIVITY_ACTIONS,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ACTIVITY_TARGET_TYPES,
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      index: true,
      default: null,
    },
    targetLabel: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // append-only
  }
);

// Compound indexes for fast query performance
ActivityLogSchema.index({ targetId: 1, createdAt: -1 });
ActivityLogSchema.index({ user: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
