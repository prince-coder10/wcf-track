export const UNIVERSITY_HALLS = [
  "Moremi Hall",
  "Queen Idia Hall",
  "Mellanby Hall",
  "Kuti Hall",
  "Independence Hall",
  "Tedder Hall",
  "Obafemi Awolowo (Awo) Hall",
  "Alexander Brown Hall (ABH)",
  "Sultan Bello Hall",
  "Queen Elizabeth II Hall",
  "Nnamdi Azikiwe (Zik) Hall",
  "Off-campus / Private Hostel",
  "Other (specify below)",
] as const;

export interface DuplicatePersonInfo {
  _id: string;
  fullName: string;
  hall: string;
  evangelizedAt?: string | null;
  assignedToName: string;
  evangelistName: string;
}
