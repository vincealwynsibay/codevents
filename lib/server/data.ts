import "server-only";
import { cache } from "react";
import { createHash } from "node:crypto";
import { db } from "./firebase";
import {
  AdminRecord,
  CodEvent,
  Registration,
  Team,
  getPhase,
  isPast,
} from "@/lib/domain";

export const eventsCol = () => db.collection("events");
export const registrationsCol = () => db.collection("registrations");
export const teamsCol = () => db.collection("teams");
export const usersCol = () => db.collection("users");
export const adminsCol = () => db.collection("admins");
/** Reservation docs that make team names and invite codes unique per event. */
export const teamKeysCol = () => db.collection("teamKeys");

export function teamNameKey(eventId: string, name: string) {
  const slug = createHash("sha1").update(name.trim().toLowerCase()).digest("hex").slice(0, 20);
  return `${eventId}_name_${slug}`;
}
export function teamCodeKey(eventId: string, code: string) {
  return `${eventId}_code_${code.toUpperCase()}`;
}

function withId<T>(snap: FirebaseFirestore.DocumentSnapshot): T {
  return { ...(snap.data() as object), id: snap.id } as T;
}

export const getEvent = cache(async (id: string): Promise<CodEvent | null> => {
  if (!id || id.includes("/")) return null;
  const snap = await eventsCol().doc(id).get();
  return snap.exists ? withId<CodEvent>(snap) : null;
});

export const listAllEvents = cache(async (): Promise<CodEvent[]> => {
  const snap = await eventsCol().get();
  return snap.docs
    .map((d) => withId<CodEvent>(d))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
});

export type PublicEvents = {
  featured: CodEvent | null;
  upcoming: CodEvent[];
  past: CodEvent[];
};

export const listPublicEvents = cache(async (): Promise<PublicEvents> => {
  const now = new Date();
  const events = (await listAllEvents()).filter((e) => e.status !== "DRAFT");
  const upcoming = events
    .filter((e) => {
      const phase = getPhase(e, now);
      return !isPast(phase) && phase !== "CANCELLED";
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const past = events
    .filter((e) => isPast(getPhase(e, now)))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  const featured =
    upcoming.find((e) => getPhase(e, now) === "ONGOING") ??
    upcoming.find((e) => getPhase(e, now) === "REGISTRATION_OPEN") ??
    upcoming[0] ??
    null;

  return {
    featured,
    upcoming: upcoming.filter((e) => e.id !== featured?.id),
    past,
  };
});

export const getRegistrationsForEvent = cache(
  async (eventId: string): Promise<Registration[]> => {
    const snap = await registrationsCol().where("eventId", "==", eventId).get();
    return snap.docs
      .map((d) => withId<Registration>(d))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
);

export const getRegistration = cache(
  async (id: string): Promise<Registration | null> => {
    if (!id || id.includes("/")) return null;
    const snap = await registrationsCol().doc(id).get();
    return snap.exists ? withId<Registration>(snap) : null;
  }
);

export const getRegistrationsForUser = cache(
  async (uid: string): Promise<Registration[]> => {
    const snap = await registrationsCol().where("uid", "==", uid).get();
    return snap.docs.map((d) => withId<Registration>(d));
  }
);

export const getTeamsForEvent = cache(
  async (eventId: string): Promise<Team[]> => {
    const snap = await teamsCol().where("eventId", "==", eventId).get();
    return snap.docs
      .map((d) => withId<Team>(d))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
);

export const getTeam = cache(async (id: string): Promise<Team | null> => {
  if (!id || id.includes("/")) return null;
  const snap = await teamsCol().doc(id).get();
  return snap.exists ? withId<Team>(snap) : null;
});

export const listAdmins = cache(async (): Promise<AdminRecord[]> => {
  const snap = await adminsCol().get();
  return snap.docs
    .map((d) => d.data() as AdminRecord)
    .sort((a, b) => a.email.localeCompare(b.email));
});

export async function getEventsByIds(ids: string[]): Promise<CodEvent[]> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return [];
  const snaps = await db.getAll(...unique.map((id) => eventsCol().doc(id)));
  return snaps.filter((s) => s.exists).map((s) => withId<CodEvent>(s));
}
