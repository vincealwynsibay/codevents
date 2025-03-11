"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Transaction } from "firebase-admin/firestore";
import { db } from "@/lib/server/firebase";
import {
  ActionError,
  assertAdmin,
  assertStudent,
  assertViewer,
} from "@/lib/server/auth";
import { randomCode, randomToken, runAction } from "@/lib/server/action";
import {
  eventsCol,
  registrationsCol,
  teamCodeKey,
  teamKeysCol,
  teamNameKey,
  teamsCol,
  usersCol,
} from "@/lib/server/data";
import { profileSchema } from "@/lib/schemas";
import {
  CodEvent,
  Registration,
  Team,
  UserProfile,
  getPhase,
  parseQrPayload,
  registrationId,
  schoolYearOf,
} from "@/lib/domain";

function revalidateEvent(eventId: string) {
  revalidatePath("/", "layout");
  revalidatePath(`/events/${eventId}`);
}

// ---------------- profile ----------------

export async function saveProfile(input: {
  name: string;
  course: string;
  yearLevel: string;
}) {
  return runAction(async () => {
    const viewer = await assertViewer();
    const data = profileSchema.parse(input);
    const now = new Date().toISOString();
    const profile: UserProfile = {
      uid: viewer.user.uid,
      email: viewer.user.email,
      photoURL: viewer.user.picture,
      ...data,
      schoolYear: schoolYearOf(),
      createdAt: viewer.profile?.createdAt ?? now,
      updatedAt: now,
    };
    await usersCol().doc(viewer.user.uid).set(profile);
    revalidatePath("/", "layout");
    return { message: "Profile saved." };
  });
}

// ---------------- register ----------------

export type TeamChoice =
  | { mode: "create"; name: string }
  | { mode: "join"; code: string };

export async function registerForEvent(eventId: string, team?: TeamChoice) {
  return runAction(async () => {
    const viewer = await assertStudent();
    const { user, profile } = viewer;
    const regRef = registrationsCol().doc(registrationId(eventId, user.uid));
    const eventRef = eventsCol().doc(eventId);

    await db.runTransaction(async (tx) => {
      const [eventSnap, regSnap] = await Promise.all([tx.get(eventRef), tx.get(regRef)]);
      if (!eventSnap.exists) throw new ActionError("Event not found.");
      const event = { ...(eventSnap.data() as CodEvent), id: eventSnap.id };
      if (regSnap.exists) throw new ActionError("You're already signed up for this event.");

      const phase = getPhase(event);
      if (phase !== "REGISTRATION_OPEN") {
        if (event.capacity !== null && event.registrationCount >= event.capacity) {
          throw new ActionError("Sorry, this event is full.");
        }
        throw new ActionError("Registration for this event is closed.");
      }

      let teamId: string | null = null;
      if (event.participation === "TEAM") {
        if (!team) throw new ActionError("Create a team or join one with a code.");
        if (team.mode === "create") {
          const name = team.name.trim();
          if (name.length < 2 || name.length > 40) {
            throw new ActionError("Team name must be 2–40 characters.");
          }
          // Reserve the name and invite code with deterministic docs, so two
          // concurrent creates can't both win (empty query results aren't locked).
          const nameKey = teamKeysCol().doc(teamNameKey(eventId, name));
          if ((await tx.get(nameKey)).exists) throw new ActionError("That team name is taken.");
          let code = "";
          for (let i = 0; i < 5 && !code; i++) {
            const candidate = randomCode();
            if (!(await tx.get(teamKeysCol().doc(teamCodeKey(eventId, candidate)))).exists) code = candidate;
          }
          if (!code) throw new ActionError("Couldn't make a team code. Please try again.");
          const teamRef = teamsCol().doc();
          teamId = teamRef.id;
          tx.set(nameKey, { eventId, teamId });
          tx.set(teamKeysCol().doc(teamCodeKey(eventId, code)), { eventId, teamId });
          const newTeam: Omit<Team, "id"> & { nameLower: string } = {
            eventId,
            name,
            nameLower: name.toLowerCase(),
            code,
            captainUid: user.uid,
            memberUids: [user.uid],
            memberNames: [profile.name],
            createdAt: new Date().toISOString(),
          };
          tx.set(teamRef, newTeam);
        } else {
          const code = team.code.trim().toUpperCase();
          const found = await tx.get(
            teamsCol().where("eventId", "==", eventId).where("code", "==", code).limit(1)
          );
          if (found.empty) throw new ActionError("No team with that code for this event.");
          const teamDoc = found.docs[0];
          const t = teamDoc.data() as Team;
          if (t.memberUids.length >= event.teamMax) {
            throw new ActionError(`Team ${t.name} is full (max ${event.teamMax}).`);
          }
          teamId = teamDoc.id;
          tx.update(teamDoc.ref, {
            memberUids: FieldValue.arrayUnion(user.uid),
            memberNames: [...t.memberNames, profile.name],
          });
        }
      }

      const reg: Omit<Registration, "id"> = {
        eventId,
        uid: user.uid,
        name: profile.name,
        email: user.email,
        photoURL: user.picture,
        course: profile.course,
        yearLevel: profile.yearLevel,
        teamId,
        checkinToken: randomToken(),
        checkedInAt: null,
        createdAt: new Date().toISOString(),
      };
      tx.set(regRef, reg);
      tx.update(eventRef, { registrationCount: FieldValue.increment(1) });
    });

    revalidateEvent(eventId);
    return { message: "You're in! See you there." };
  });
}

/** Removes a registration and tidies up its team. Runs inside a transaction. */
async function removeRegistrationTx(tx: Transaction, regId: string) {
  const regRef = registrationsCol().doc(regId);
  const regSnap = await tx.get(regRef);
  if (!regSnap.exists) throw new ActionError("Registration not found.");
  const reg = regSnap.data() as Registration;

  const eventRef = eventsCol().doc(reg.eventId);
  const eventSnap = await tx.get(eventRef);
  let teamUpdate: (() => void) | null = null;
  let teamDeleted = false;
  if (reg.teamId) {
    const teamRef = teamsCol().doc(reg.teamId);
    const teamSnap = await tx.get(teamRef);
    if (teamSnap.exists) {
      const t = teamSnap.data() as Team;
      const idx = t.memberUids.indexOf(reg.uid);
      const memberUids = t.memberUids.filter((u) => u !== reg.uid);
      const memberNames = t.memberNames.filter((_, i) => i !== idx);
      teamUpdate = () => {
        if (memberUids.length === 0) {
          tx.delete(teamRef);
          tx.delete(teamKeysCol().doc(teamNameKey(reg.eventId, t.name)));
          tx.delete(teamKeysCol().doc(teamCodeKey(reg.eventId, t.code)));
          teamDeleted = true;
        } else
          tx.update(teamRef, {
            memberUids,
            memberNames,
            captainUid: t.captainUid === reg.uid ? memberUids[0] : t.captainUid,
          });
      };
    }
  }
  // all reads done, now writes
  teamUpdate?.();
  tx.delete(regRef);
  if (eventSnap.exists) {
    const winners = (eventSnap.data() as CodEvent).winners ?? [];
    // Drop a podium spot that pointed at this person, or at their now-deleted team.
    const kept = winners.filter((w) => w.refId !== regId && !(teamDeleted && w.refId === reg.teamId));
    tx.update(eventRef, {
      registrationCount: FieldValue.increment(-1),
      ...(kept.length !== winners.length ? { winners: kept } : {}),
    });
  }
  return reg;
}

export async function cancelRegistration(eventId: string) {
  return runAction(async () => {
    const viewer = await assertViewer();
    await db.runTransaction(async (tx) => {
      const eventSnap = await tx.get(eventsCol().doc(eventId));
      if (!eventSnap.exists) throw new ActionError("Event not found.");
      const event = { ...(eventSnap.data() as CodEvent), id: eventSnap.id };
      const phase = getPhase(event);
      if (phase !== "REGISTRATION_OPEN" && phase !== "REGISTRATION_CLOSED") {
        throw new ActionError("The event has already started, so you can't cancel anymore.");
      }
      const regSnap = await tx.get(registrationsCol().doc(registrationId(eventId, viewer.user.uid)));
      if (regSnap.exists && (regSnap.data() as Registration).checkedInAt) {
        throw new ActionError("You've already checked in, so you can't cancel.");
      }
      await removeRegistrationTx(tx, registrationId(eventId, viewer.user.uid));
    });
    revalidateEvent(eventId);
    return { message: "Your registration was cancelled." };
  });
}

export async function adminRemoveRegistration(regId: string) {
  return runAction(async () => {
    await assertAdmin();
    let eventId = "";
    await db.runTransaction(async (tx) => {
      const reg = await removeRegistrationTx(tx, regId);
      eventId = reg.eventId;
    });
    revalidateEvent(eventId);
    return { message: "Participant removed." };
  });
}

// ---------------- check-in ----------------

export type CheckInResult = {
  name: string;
  course: string;
  yearLevel: string;
  teamName: string | null;
  alreadyCheckedIn: boolean;
  checkedInAt: string;
};

export async function checkInByQr(eventId: string, payload: string) {
  return runAction<CheckInResult>(async () => {
    await assertAdmin();
    const parsed = parseQrPayload(payload);
    if (!parsed) throw new ActionError("That QR code isn't a codevents ticket.");
    const data = await db.runTransaction(async (tx) => {
      const ref = registrationsCol().doc(parsed.registrationId);
      const snap = await tx.get(ref);
      if (!snap.exists) throw new ActionError("Ticket not found. They may have cancelled.");
      const reg = snap.data() as Registration;
      if (reg.checkinToken !== parsed.token) throw new ActionError("This ticket is not valid.");
      if (reg.eventId !== eventId) throw new ActionError("This ticket is for a different event.");
      let teamName: string | null = null;
      if (reg.teamId) {
        const t = await tx.get(teamsCol().doc(reg.teamId));
        teamName = t.exists ? (t.data() as Team).name : null;
      }
      const alreadyCheckedIn = !!reg.checkedInAt;
      const checkedInAt = reg.checkedInAt ?? new Date().toISOString();
      if (!alreadyCheckedIn) tx.update(ref, { checkedInAt });
      return {
        name: reg.name,
        course: reg.course,
        yearLevel: reg.yearLevel,
        teamName,
        alreadyCheckedIn,
        checkedInAt,
      };
    });
    revalidatePath(`/admin/events/${eventId}`);
    return {
      message: data.alreadyCheckedIn ? `${data.name} was already checked in.` : `${data.name} checked in.`,
      data,
    };
  });
}

export async function setCheckedIn(regId: string, checkedIn: boolean) {
  return runAction(async () => {
    await assertAdmin();
    const ref = registrationsCol().doc(regId);
    const snap = await ref.get();
    if (!snap.exists) throw new ActionError("Registration not found.");
    await ref.update({ checkedInAt: checkedIn ? new Date().toISOString() : null });
    revalidatePath(`/admin/events/${(snap.data() as Registration).eventId}`);
    return { message: checkedIn ? "Checked in." : "Check-in undone." };
  });
}
