import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationType =
  | "assignment"
  | "followup_due"
  | "overdue"
  | "security"
  | "digest"
  | "milestone"
  | "system";

export type NotificationPriority = "push" | "digest" | "in_app";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  link?: string;
  isRead: boolean;
  readAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "assignment",
        "followup_due",
        "overdue",
        "security",
        "digest",
        "milestone",
        "system",
      ],
      default: "system",
      index: true,
    },
    priority: {
      type: String,
      enum: ["push", "digest", "in_app"],
      default: "in_app",
      index: true,
    },
    link: {
      type: String,
      default: "/dashboard",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user notification inbox queries
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
