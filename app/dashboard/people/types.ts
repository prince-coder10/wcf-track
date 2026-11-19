export interface PersonItem {
  _id: string;
  fullName: string;
  phone: string;
  hall: string;
  roomOrLocation?: string | null;
  level?: string | null;
  course?: string | null;
  response: string;
  status: string;
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
  preferredContact?: string | null;
  createdAt?: string | null;
}

export interface UserOption {
  _id: string;
  fullName: string;
  role: string;
}

export interface FollowUpStats {
  assigned: number;
  newCount: number;
  overdue: number;
}

export interface PeopleResponse {
  people: PersonItem[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  halls: string[];
  followUpUsers: UserOption[];
  evangelistUsers: UserOption[];
  canManageAssignment: boolean;
  followUpStats?: FollowUpStats;
}
