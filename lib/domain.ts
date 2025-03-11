// Pure domain types and rules. No Firebase imports here, so this file is safe
// to use from both server and client components.

export const APP_TIMEZONE = "Asia/Manila";
export const ALLOWED_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "umindanao.edu.ph";

export const EVENT_TYPES = ["CONTEST", "TALK", "WORKSHOP", "OTHER"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  CONTEST: "Contest",
  TALK: "Talk",
  WORKSHOP: "Workshop",
  OTHER: "Event",
};

// The one stored status. ONGOING / COMPLETED are derived from dates (see getPhase).
export const EVENT_STATUSES = [
  "DRAFT",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "CANCELLED",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export type Phase =
  | "DRAFT"
  | "CANCELLED"
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "ONGOING"
  | "AWAITING_RESULTS"
  | "COMPLETED";

export const PHASE_LABEL: Record<Phase, string> = {
  DRAFT: "Draft",
  CANCELLED: "Cancelled",
  REGISTRATION_OPEN: "Registration open",
  REGISTRATION_CLOSED: "Registration closed",
  ONGOING: "Happening now",
  AWAITING_RESULTS: "Awaiting results",
  COMPLETED: "Completed",
};

export type Participation = "SOLO" | "TEAM";
export type Place = 1 | 2 | 3;

export type Prize = {
  place: Place;
  title: string;
  description: string;
  imageUrl: string | null;
};

export type Winner = {
  place: Place;
  /** registration id (solo events) or team id (team events) */
  refId: string;
  name: string;
  members?: string[];
};

export type CodEvent = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  type: EventType;
  venue: string;
  coverImageUrl: string | null;
  startDate: string; // ISO
  endDate: string; // ISO
  registrationDeadline: string | null; // ISO
  capacity: number | null;
  participation: Participation;
  teamMin: number;
  teamMax: number;
  prizes: Prize[];
  winners: Winner[];
  status: EventStatus;
  registrationCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

export type Registration = {
  id: string; // `${eventId}_${uid}`
  eventId: string;
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
  // snapshot of the profile at sign-up time
  course: string;
  yearLevel: string;
  teamId: string | null;
  checkinToken: string;
  checkedInAt: string | null;
  createdAt: string;
};

export type Team = {
  id: string;
  eventId: string;
  name: string;
  code: string;
  captainUid: string;
  memberUids: string[];
  memberNames: string[];
  createdAt: string;
};

export type UserProfile = {
  uid: string;
  email: string;
  name: string;
  photoURL: string | null;
  course: string;
  yearLevel: string;
  /** school year the course/year level were last confirmed for, e.g. "2026-2027" */
  schoolYear: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminRole = "OWNER" | "OFFICER";
export type AdminRecord = {
  email: string;
  role: AdminRole;
  addedBy: string;
  addedAt: string;
};

export const COURSES = [
  "BS Computer Science",
  "BS Information Technology",
  "BS Information Systems",
  "BS Computer Engineering",
  "BS Entertainment and Multimedia Computing",
  "Other",
] as const;

export const YEAR_LEVELS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
] as const;

export const PLACE_LABEL: Record<Place, string> = {
  1: "1st Place",
  2: "2nd Place",
  3: "3rd Place",
};

/** School year starts in August (PH academic calendar). */
export function schoolYearOf(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);
  const y = Number(parts.find((p) => p.type === "year")!.value);
  const m = Number(parts.find((p) => p.type === "month")!.value);
  return m >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export function profileNeedsUpdate(profile: UserProfile | null): boolean {
  return (
    !profile ||
    !profile.course ||
    !profile.yearLevel ||
    profile.schoolYear !== schoolYearOf()
  );
}

export function isFull(event: Pick<CodEvent, "capacity" | "registrationCount">) {
  return event.capacity !== null && event.registrationCount >= event.capacity;
}

export function getPhase(event: CodEvent, now: Date = new Date()): Phase {
  if (event.status === "DRAFT") return "DRAFT";
  if (event.status === "CANCELLED") return "CANCELLED";
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  if (now >= end) {
    return event.prizes.length > 0 && event.winners.length === 0
      ? "AWAITING_RESULTS"
      : "COMPLETED";
  }
  if (now >= start) return "ONGOING";
  if (event.status === "REGISTRATION_OPEN") {
    const deadlinePassed =
      event.registrationDeadline !== null &&
      now >= new Date(event.registrationDeadline);
    if (deadlinePassed || isFull(event)) return "REGISTRATION_CLOSED";
    return "REGISTRATION_OPEN";
  }
  return "REGISTRATION_CLOSED";
}

export function isPast(phase: Phase) {
  return phase === "COMPLETED" || phase === "AWAITING_RESULTS";
}

export function isPublic(event: CodEvent) {
  return event.status !== "DRAFT";
}

/** Only same-site paths. Rejects "//host" and "/\\host", which browsers treat as external. */
export function safeNextPath(next: string | undefined | null, fallback = "/me") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}

export function registrationId(eventId: string, uid: string) {
  return `${eventId}_${uid}`;
}

export function qrPayload(reg: Pick<Registration, "id" | "checkinToken">) {
  return `codevents:${reg.id}:${reg.checkinToken}`;
}

export function parseQrPayload(
  value: string
): { registrationId: string; token: string } | null {
  const m = /^codevents:([A-Za-z0-9_-]+):([A-Za-z0-9]+)$/.exec(value.trim());
  return m ? { registrationId: m[1], token: m[2] } : null;
}

// ---- formatting (fixed timezone so server and client render the same) ----

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: APP_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    ...opts,
  }).format(new Date(iso));
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: APP_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return `${formatDate(iso, { weekday: "short" })} · ${formatTime(iso)}`;
}

export function formatRange(startIso: string, endIso: string) {
  const sameDay = formatDate(startIso) === formatDate(endIso);
  if (sameDay) {
    return `${formatDate(startIso, { weekday: "short" })} · ${formatTime(
      startIso
    )} – ${formatTime(endIso)}`;
  }
  return `${formatDateTime(startIso)} → ${formatDateTime(endIso)}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}
