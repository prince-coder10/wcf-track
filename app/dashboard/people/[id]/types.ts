export interface PersonDetailData {
  _id: string;
  fullName: string;
  phone: string;
  phoneNormalized: string;
  hall: string;
  roomOrLocation?: string | null;
  level?: string | null;
  course?: string | null;
  response: string;
  status: string;
  preferredContact?: string | null;
  currentChurch?: string | null;
  prayerRequest?: string | null;
  handoffNote?: string | null;
  evangelizedAt?: string | null;
  evangelist?: {
    _id: string;
    fullName: string;
  } | null;
  assignedTo?: {
    _id: string;
    fullName: string;
  } | null;
  checkInCount: number;
  lastContactAt?: string | null;
  lastContactDays?: number | null;
  nextFollowUpAt?: string | null;
  createdBy?: string;
  createdAt?: string | null;
  assignmentHistory: {
    toName: string;
    byName: string;
    at?: string | null;
  }[];
}

export interface CheckInItem {
  _id: string;
  method: string;
  reached: boolean;
  outcome?: string | null;
  customOutcome?: string | null;
  notes?: string | null;
  nextFollowUpAt?: string | null;
  previousStatus: string;
  newStatus: string;
  userName: string;
  createdAt: string;
}

export interface ActivityHistoryItem {
  action: string;
  userName: string;
  userRole: string;
  details: string;
  createdAt: string;
}
