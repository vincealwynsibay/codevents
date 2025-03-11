"use server";

import { revalidatePath } from "next/cache";
import { eventInputSchema, EventInput } from "@/lib/schemas";
import { db } from "@/lib/server/firebase";
import {
  ActionError,
  assertAdmin,
} from "@/lib/server/auth";
import { runAction } from "@/lib/server/action";
import {
  eventsCol,
  getEvent,
  getRegistrationsForEvent,
  getTeamsForEvent,
  registrationsCol,
  teamKeysCol,
  teamsCol,
} from "@/lib/server/data";
import {
  CodEvent,
  EVENT_STATUSES,
  EventStatus,
  Place,
  Winner,
} from "@/lib/domain";


function revalidateEvent(id?: string) {
  revalidatePath("/", "layout");
  if (id) revalidatePath(`/events/${id}`);
}

export async function saveEvent(id: string | null, input: EventInput) {
  return runAction<{ id: string }>(async () => {
    const viewer = await assertAdmin();
    const data = eventInputSchema.parse(input);
    const now = new Date().toISOString();
    const normalized = {
      ...data,
      teamMin: data.participation === "TEAM" ? data.teamMin : 1,
      teamMax: data.participation === "TEAM" ? data.teamMax : 1,
      prizes: [...data.prizes].sort((a, b) => a.place - b.place),
      updatedAt: now,
    };

    if (id) {
      // Transactional so a sign-up landing mid-edit can't slip past the capacity/format checks.
      await db.runTransaction(async (tx) => {
        const ref = eventsCol().doc(id);
        const snap = await tx.get(ref);
        if (!snap.exists) throw new ActionError("Event not found.");
        const existing = snap.data() as CodEvent;
        if (existing.participation !== normalized.participation && existing.registrationCount > 0) {
          throw new ActionError("Can't switch between solo and team after people have signed up.");
        }
        if (normalized.capacity !== null && normalized.capacity < existing.registrationCount) {
          throw new ActionError(
            `Capacity can't be lower than the ${existing.registrationCount} people already signed up.`
          );
        }
        if (normalized.participation === "TEAM") {
          const teams = await tx.get(teamsCol().where("eventId", "==", id));
          const largest = Math.max(0, ...teams.docs.map((d) => (d.data().memberUids as string[]).length));
          if (normalized.teamMax < largest) {
            throw new ActionError(`Max team size can't be lower than the largest team (${largest} members).`);
          }
        }
        // Drop winners for places that no longer have a prize.
        const keptPlaces = new Set(normalized.prizes.map((p) => p.place));
        tx.update(ref, {
          ...normalized,
          winners: existing.winners.filter((w) => keptPlaces.has(w.place)),
        });
      });
      revalidateEvent(id);
      return { message: "Event saved.", data: { id } };
    }

    const doc: Omit<CodEvent, "id"> = {
      ...normalized,
      winners: [],
      status: "DRAFT",
      registrationCount: 0,
      createdAt: now,
      createdBy: viewer.user.email,
    };
    const ref = await eventsCol().add(doc);
    revalidateEvent(ref.id);
    return { message: "Draft created.", data: { id: ref.id } };
  });
}

export async function setEventStatus(id: string, status: EventStatus) {
  return runAction(async () => {
    await assertAdmin();
    if (!EVENT_STATUSES.includes(status)) throw new ActionError("Unknown status.");
    await db.runTransaction(async (tx) => {
      const ref = eventsCol().doc(id);
      const snap = await tx.get(ref);
      if (!snap.exists) throw new ActionError("Event not found.");
      if (status === "DRAFT" && (snap.data() as CodEvent).registrationCount > 0) {
        throw new ActionError("People have signed up, so this event can't go back to draft. Close registration instead.");
      }
      tx.update(ref, { status, updatedAt: new Date().toISOString() });
    });
    revalidateEvent(id);
    const messages: Record<EventStatus, string> = {
      DRAFT: "Moved back to draft.",
      REGISTRATION_OPEN: "Registration is open.",
      REGISTRATION_CLOSED: "Registration is closed.",
      CANCELLED: "Event cancelled.",
    };
    return { message: messages[status] };
  });
}

export async function deleteEvent(id: string) {
  return runAction(async () => {
    await assertAdmin();
    const event = await getEvent(id);
    if (!event) throw new ActionError("Event not found.");
    // Cancel first so no new sign-up can commit while we collect what to delete.
    await eventsCol().doc(id).update({ status: "CANCELLED" });
    const [regs, teams, keys] = await Promise.all([
      registrationsCol().where("eventId", "==", id).get(),
      teamsCol().where("eventId", "==", id).get(),
      teamKeysCol().where("eventId", "==", id).get(),
    ]);
    const writer = db.bulkWriter();
    regs.docs.forEach((d) => writer.delete(d.ref));
    keys.docs.forEach((d) => writer.delete(d.ref));
    teams.docs.forEach((d) => writer.delete(d.ref));
    writer.delete(eventsCol().doc(id));
    await writer.close();
    revalidateEvent();
    return { message: "Event deleted." };
  });
}

export async function duplicateEvent(id: string) {
  return runAction<{ id: string }>(async () => {
    const viewer = await assertAdmin();
    const event = await getEvent(id);
    if (!event) throw new ActionError("Event not found.");
    const now = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...rest } = event;
    const ref = await eventsCol().add({
      ...rest,
      title: `${event.title} (copy)`,
      winners: [],
      status: "DRAFT",
      registrationCount: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: viewer.user.email,
    });
    revalidateEvent();
    return { message: "Copied as a new draft.", data: { id: ref.id } };
  });
}

export async function setWinners(
  eventId: string,
  picks: { place: Place; refId: string }[]
) {
  return runAction(async () => {
    await assertAdmin();
    const event = await getEvent(eventId);
    if (!event) throw new ActionError("Event not found.");
    if (event.prizes.length === 0) throw new ActionError("This event has no prizes.");

    const prizePlaces = new Set(event.prizes.map((p) => p.place));
    const chosen = picks.filter((p) => p.refId);
    const refIds = chosen.map((p) => p.refId);
    if (new Set(refIds).size !== refIds.length) {
      throw new ActionError("The same entry can't win two places.");
    }
    if (new Set(chosen.map((p) => p.place)).size !== chosen.length) {
      throw new ActionError("Each place can only have one winner.");
    }

    const winners: Winner[] = [];
    if (event.participation === "TEAM") {
      const teams = await getTeamsForEvent(eventId);
      for (const pick of chosen) {
        if (!prizePlaces.has(pick.place)) throw new ActionError("No prize for that place.");
        const team = teams.find((t) => t.id === pick.refId);
        if (!team) throw new ActionError("Team not found.");
        winners.push({ place: pick.place, refId: team.id, name: team.name, members: team.memberNames });
      }
    } else {
      const regs = await getRegistrationsForEvent(eventId);
      for (const pick of chosen) {
        if (!prizePlaces.has(pick.place)) throw new ActionError("No prize for that place.");
        const reg = regs.find((r) => r.id === pick.refId);
        if (!reg) throw new ActionError("Participant not found.");
        winners.push({ place: pick.place, refId: reg.id, name: reg.name });
      }
    }
    winners.sort((a, b) => a.place - b.place);
    await eventsCol().doc(eventId).update({ winners, updatedAt: new Date().toISOString() });
    revalidateEvent(eventId);
    return { message: winners.length ? "Winners saved." : "Winners cleared." };
  });
}
