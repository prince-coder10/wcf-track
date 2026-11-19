import mongoose, { Schema, model, models, Document, Types } from "mongoose";
import { PersonStatus, PERSON_STATUSES } from "@/lib/status";

export const CHECKIN_METHODS = ["whatsapp", "call", "visit"] as const;
export type CheckInMethod = (typeof CHECKIN_METHODS)[number];

export const REACHED_OUTCOMES = [
  "responded_warmly",
  "contact_later",
  "attended_service",
  "not_interested",
  "other",
] as const;
export type ReachedOutcome = (typeof REACHED_OUTCOMES)[number];

export const NO_ANSWER_OUTCOMES = [
  "switched_off",
  "ringing_no_answer",
  "line_busy",
  "wrong_number",
  "other",
] as const;
export type NoAnswerOutcome = (typeof NO_ANSWER_OUTCOMES)[number];

export interface ICheckIn extends Document {
  person: Types.ObjectId;
  user: Types.ObjectId;
  method: CheckInMethod;
  reached: boolean;
  outcome?: string;
  customOutcome?: string;
  notes?: string;
  nextFollowUpAt?: Date;
  previousStatus: PersonStatus;
  newStatus: PersonStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type CheckInModel = mongoose.Model<ICheckIn>;

const checkInSchema = new Schema<ICheckIn, CheckInModel>(
  {
    person: { type: Schema.Types.ObjectId, ref: "Person", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    method: { type: String, enum: CHECKIN_METHODS, required: true },
    reached: { type: Boolean, required: true },
    outcome: { type: String, trim: true },
    customOutcome: { type: String, trim: true },
    notes: { type: String, trim: true },
    nextFollowUpAt: Date,
    previousStatus: { type: String, enum: PERSON_STATUSES, required: true },
    newStatus: { type: String, enum: PERSON_STATUSES, required: true },
  },
  { timestamps: true }
);

checkInSchema.index({ person: 1, createdAt: -1 });
checkInSchema.index({ user: 1, createdAt: -1 });

export default (models.CheckIn as CheckInModel) ||
  model<ICheckIn, CheckInModel>("CheckIn", checkInSchema);
