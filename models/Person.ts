import mongoose, { Schema, model, models, Document, Types } from "mongoose";
import {
  PERSON_STATUSES,
  PersonStatus,
  RESPONSES,
  PersonResponse,
  CONTACT_METHODS,
  ContactMethod,
} from "@/lib/status";

export { PERSON_STATUSES, RESPONSES, CONTACT_METHODS };
export type { PersonStatus, PersonResponse, ContactMethod };

export interface IAssignmentHistory {
  from?: Types.ObjectId;
  to?: Types.ObjectId;
  by?: Types.ObjectId;
  at: Date;
}

export interface IPerson extends Document {
  // Required at entry
  fullName: string;
  phone: string;
  phoneNormalized: string;
  hall: string;
  evangelizedAt: Date;
  evangelist: Types.ObjectId;
  response: PersonResponse;

  // Helps follow-up (optional)
  roomOrLocation?: string;
  level?: string;
  course?: string;
  preferredContact?: ContactMethod;
  currentChurch?: string;
  prayerRequest?: string;
  handoffNote?: string;

  // Consent
  consentConfirmed: boolean;
  consentAt?: Date;

  // Pipeline and assignment
  status: PersonStatus;
  assignedTo?: Types.ObjectId | null;
  assignedAt?: Date;
  assignmentHistory: IAssignmentHistory[];

  // Follow-up tracking (updated whenever a CheckIn is saved)
  checkInCount: number;
  lastContactAt?: Date;
  lastAttemptAt?: Date;
  nextFollowUpAt?: Date;
  statusChangedAt?: Date;
  integratedAt?: Date;
  closedReason?: string;

  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type PersonModel = mongoose.Model<IPerson>;

/**
 * Normalises Nigerian phone numbers so 0803..., 803..., +234803... all match
 */
export function normalizePhone(raw: string): string {
  if (!raw) return "";
  const p = String(raw).replace(/[^\d+]/g, "");
  if (p.startsWith("+")) return p;
  if (p.startsWith("234")) return "+" + p;
  if (p.startsWith("0")) return "+234" + p.slice(1);
  return "+234" + p;
}

const assignmentHistorySchema = new Schema<IAssignmentHistory>(
  {
    from: { type: Schema.Types.ObjectId, ref: "User" },
    to: { type: Schema.Types.ObjectId, ref: "User" },
    by: { type: Schema.Types.ObjectId, ref: "User" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const personSchema = new Schema<IPerson, PersonModel>(
  {
    // ---- Required at entry ----
    fullName: { type: String, required: true, trim: true },

    phone: { type: String, required: true, trim: true },
    phoneNormalized: { type: String, required: true, index: true },

    hall: { type: String, required: true, trim: true },
    evangelizedAt: { type: Date, required: true, default: Date.now },

    evangelist: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    response: { type: String, enum: RESPONSES, required: true },

    // ---- Helps follow-up (optional) ----
    roomOrLocation: { type: String, trim: true },
    level: { type: String, trim: true },
    course: { type: String, trim: true },
    preferredContact: { type: String, enum: CONTACT_METHODS },
    currentChurch: { type: String, trim: true },
    prayerRequest: { type: String, trim: true },
    handoffNote: { type: String, trim: true },

    // ---- Consent ----
    consentConfirmed: { type: Boolean, required: true },
    consentAt: Date,

    // ---- Pipeline and assignment ----
    status: { type: String, enum: PERSON_STATUSES, default: "new", index: true },

    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    assignedAt: Date,
    assignmentHistory: [assignmentHistorySchema],

    // ---- Follow-up tracking ----
    checkInCount: { type: Number, default: 0 },
    lastContactAt: Date,
    lastAttemptAt: Date,
    nextFollowUpAt: Date,
    statusChangedAt: Date,
    integratedAt: Date,

    closedReason: { type: String, trim: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

personSchema.pre("validate", function () {
  if (this.isModified("phone") || (!this.phoneNormalized && this.phone)) {
    this.phoneNormalized = normalizePhone(this.phone);
  }
  if (this.isNew && this.consentConfirmed && !this.consentAt) {
    this.consentAt = new Date();
  }
  if (this.isModified("status")) {
    this.statusChangedAt = new Date();
  }
  if (this.status === "integrated" && !this.integratedAt) {
    this.integratedAt = new Date();
  }
});

// Keep status consistent with assignment
personSchema.pre("save", function () {
  if (this.status === "new" && this.assignedTo) {
    this.status = "assigned";
    if (!this.assignedAt) {
      this.assignedAt = new Date();
    }
  }
  if (this.status === "assigned" && !this.assignedTo) {
    this.status = "new";
    this.assignedAt = undefined;
  }
});

// ---- Compound & Single Indexes for query optimization ----
personSchema.index({ createdAt: -1 });                               // Default sorting for paginated tables
personSchema.index({ evangelist: 1, createdAt: -1 });               // Evangelist personal view filter & sort
personSchema.index({ assignedTo: 1, status: 1, lastContactAt: 1 }); // My people / overdue queries
personSchema.index({ assignedTo: 1, nextFollowUpAt: 1 });           // Due today
personSchema.index({ status: 1, assignedTo: 1, createdAt: 1 });     // Unassigned queue
personSchema.index({ hall: 1, status: 1 });                          // Filters on People list
personSchema.index({ evangelizedAt: -1 });                           // Dashboard activity & analytics
personSchema.index({ fullName: "text", hall: "text" });              // Quick search

export default (models.Person as PersonModel) ||
  model<IPerson, PersonModel>("Person", personSchema);
