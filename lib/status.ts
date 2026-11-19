export const PERSON_STATUSES = [
  "new",         // recorded, not yet assigned
  "assigned",    // given to a follow-up member, not yet contacted
  "contacted",   // at least one successful contact
  "met",         // met in person
  "integrated",  // confirmed integrated into fellowship/unit
  "unreachable", // wrong number, moved, no answer after repeated tries
  "closed",      // declined, or handed to another team
] as const;

export type PersonStatus = (typeof PERSON_STATUSES)[number];

export const RESPONSES = [
  "received_christ",
  "interested",
  "just_listened",
  "not_yet",
] as const;

export type PersonResponse = (typeof RESPONSES)[number];

export const CONTACT_METHODS = ["whatsapp", "call", "visit"] as const;

export type ContactMethod = (typeof CONTACT_METHODS)[number];

export const CHECKIN_METHODS = ["whatsapp", "call", "visit"] as const;
export type CheckInMethod = (typeof CHECKIN_METHODS)[number];

export const CHECKIN_OUTCOMES = [
  "responded_warmly",
  "contact_later",
  "attended_service",
  "not_interested",
  "switched_off",
  "ringing_no_answer",
  "line_busy",
  "wrong_number",
  "other",
] as const;
export type CheckInOutcome = (typeof CHECKIN_OUTCOMES)[number];

export interface StatusMeta {
  label: string;
  description: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const PERSON_STATUS_CONFIG: Record<PersonStatus, StatusMeta> = {
  new: {
    label: "New",
    description: "Recorded, not yet assigned to follow-up",
    color: "#64748b",
    badgeBg: "bg-slate-500/10 dark:bg-slate-400/10",
    badgeText: "text-slate-700 dark:text-slate-300",
    badgeBorder: "border-slate-200 dark:border-slate-800",
  },
  assigned: {
    label: "Assigned",
    description: "Given to follow-up member, not yet contacted",
    color: "#3b82f6",
    badgeBg: "bg-blue-500/10 dark:bg-blue-400/10",
    badgeText: "text-blue-700 dark:text-blue-300",
    badgeBorder: "border-blue-200 dark:border-blue-800/40",
  },
  contacted: {
    label: "Contacted",
    description: "At least one successful communication",
    color: "#0ea5e9",
    badgeBg: "bg-sky-500/10 dark:bg-sky-400/10",
    badgeText: "text-sky-700 dark:text-sky-300",
    badgeBorder: "border-sky-200 dark:border-sky-800/40",
  },
  met: {
    label: "Met in Person",
    description: "In-person visit or meeting held",
    color: "#8b5cf6",
    badgeBg: "bg-purple-500/10 dark:bg-purple-400/10",
    badgeText: "text-purple-700 dark:text-purple-300",
    badgeBorder: "border-purple-200 dark:border-purple-800/40",
  },
  integrated: {
    label: "Integrated",
    description: "Active in fellowship and church family",
    color: "#10b981",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-400/10",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    badgeBorder: "border-emerald-200 dark:border-emerald-800/40",
  },
  unreachable: {
    label: "Unreachable",
    description: "Wrong number, moved, or no answer after multiple tries",
    color: "#f59e0b",
    badgeBg: "bg-amber-500/10 dark:bg-amber-400/10",
    badgeText: "text-amber-700 dark:text-amber-300",
    badgeBorder: "border-amber-200 dark:border-amber-800/40",
  },
  closed: {
    label: "Closed",
    description: "Declined further contact or handed to another ministry",
    color: "#ef4444",
    badgeBg: "bg-rose-500/10 dark:bg-rose-400/10",
    badgeText: "text-rose-700 dark:text-rose-300",
    badgeBorder: "border-rose-200 dark:border-rose-800/40",
  },
};

export const RESPONSE_CONFIG: Record<
  PersonResponse,
  { label: string; badgeBg: string; badgeText: string }
> = {
  received_christ: {
    label: "Received Christ",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-400/10",
    badgeText: "text-emerald-700 dark:text-emerald-300",
  },
  interested: {
    label: "Interested",
    badgeBg: "bg-blue-500/10 dark:bg-blue-400/10",
    badgeText: "text-blue-700 dark:text-blue-300",
  },
  just_listened: {
    label: "Just Listened",
    badgeBg: "bg-amber-500/10 dark:bg-amber-400/10",
    badgeText: "text-amber-700 dark:text-amber-300",
  },
  not_yet: {
    label: "Not Yet",
    badgeBg: "bg-slate-500/10 dark:bg-slate-400/10",
    badgeText: "text-slate-700 dark:text-slate-300",
  },
};

export const CONTACT_METHOD_CONFIG: Record<
  ContactMethod,
  { label: string; icon: string }
> = {
  whatsapp: { label: "WhatsApp", icon: "message-circle" },
  call: { label: "Phone Call", icon: "phone" },
  visit: { label: "Physical Visit", icon: "map-pin" },
};
