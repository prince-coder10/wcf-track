import mongoose, { Document, Schema, Types } from "mongoose";

export const WCF_EVENTS = [
  "prayer_meeting", // Monday Prayer Meetings
  "fjc",            // Tuesday Freshers Jewel Committee (FJC)
  "bible_study",    // Thursday Bible Study
  "sunday_service", // Sunday Main Service
] as const;

export type WcfEvent = (typeof WCF_EVENTS)[number];

export const ABSENTEE_STATUSES = [
  "pending",      // Not contacted yet
  "contacted",    // Reached out
  "resolved",     // Attended or confirmed returning
  "unreachable",  // Phone off / wrong number
] as const;

export type AbsenteeStatus = (typeof ABSENTEE_STATUSES)[number];

export interface IFellowshipMember extends Document {
  _id: Types.ObjectId;
  fullName: string;
  phone: string;
  phoneNormalized: string;
  hostel: string;
  roomOrBlock?: string;
  unit?: string;
  newMember: boolean;
  
  // Last session missed
  sessionDate: Date;
  event: WcfEvent;
  
  // Last time they checked in according to the attendance app
  lastCheckInDate: Date;

  // Assignment & Follow-up tracking
  assignedTo?: Types.ObjectId;
  assignedAt?: Date;
  status: AbsenteeStatus;
  statusChangedAt?: Date;
  
  checkInCount: number;
  lastContactAt?: Date;
  nextFollowUpAt?: Date;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const FellowshipMemberSchema = new Schema<IFellowshipMember>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNormalized: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    hostel: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    roomOrBlock: {
      type: String,
      trim: true,
      default: null,
    },
    unit: {
      type: String,
      trim: true,
      default: null,
    },
    newMember: {
      type: Boolean,
      default: false,
      index: true,
    },
    sessionDate: {
      type: Date,
      required: true,
      index: true,
    },
    event: {
      type: String,
      enum: WCF_EVENTS,
      required: true,
      index: true,
    },
    lastCheckInDate: {
      type: Date,
      required: true,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ABSENTEE_STATUSES,
      default: "pending",
      index: true,
    },
    statusChangedAt: {
      type: Date,
      default: Date.now,
    },
    checkInCount: {
      type: Number,
      default: 0,
    },
    lastContactAt: {
      type: Date,
      default: null,
    },
    nextFollowUpAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

FellowshipMemberSchema.index({ phoneNormalized: 1, event: 1 });
FellowshipMemberSchema.index({ assignedTo: 1, status: 1 });
FellowshipMemberSchema.index({ sessionDate: -1 });

export default mongoose.models.FellowshipMember ||
  mongoose.model<IFellowshipMember>("FellowshipMember", FellowshipMemberSchema);
