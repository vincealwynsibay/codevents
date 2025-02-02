"use server";
import { z } from "zod";
import { db } from "./../firebase/clientApp";
import { EventPayload, eventSchema } from "./../validation";
import { Event, FormState, Participant } from "@/types/types";
import {
  addDoc,
  updateDoc,
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { isBefore, parseISO } from "date-fns";

import { auth } from "@clerk/nextjs/server";
// get events with sort and filter as parameter
export async function getEvents() {
  const { userId } = await auth();
  if (!userId) {
    return { message: "You must be signed in to perform this action." };
  }
  // get events
  const events = await getDocs(collection(db, "events"));

  return {
    data: events.docs.map((doc) => {
      return { ...(doc.data() as EventPayload), id: doc.id };
    }),
  };
}

export async function getLatestActiveEvent() {
  // get the latest event based on the start date and published status
  const q = query(collection(db, "events"), where("isActive", "==", true));

  const events = await getDocs(q);
  // sort events based on name
  const sortedEvents = events.docs.sort((a, b) => {
    return isBefore(parseISO(a.data().startDate), parseISO(b.data().startDate))
      ? 1
      : -1;
  });

  return {
    data:
      sortedEvents.length > 0
        ? {
            ...(sortedEvents[0].data() as EventPayload),
            id: sortedEvents[0].id,
          }
        : null,
  };
}

export async function getPublishedEvents() {
  const { userId } = await auth();
  if (!userId) {
    return { message: "You must be signed in to perform this action." };
  }
  // get events
  // get only events with isActive is true
  const q = query(collection(db, "events"), where("isActive", "==", true));

  const events = await getDocs(q);

  return {
    data: events.docs.map((doc) => {
      return { ...(doc.data() as EventPayload), id: doc.id };
    }),
  };
}

// create event
export async function createEvent(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { message: "You must be signed in to perform this action." };
    }
    const validatedFields = eventSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      status: formData.get("status"),
      prize1: formData.get("prize1"),
      prize2: formData.get("prize2"),
      prize3: formData.get("prize3"),
      prizeDescription1: formData.get("prizeDescription1"),
      prizeDescription2: formData.get("prizeDescription2"),
      prizeDescription3: formData.get("prizeDescription3"),
    });

    if (!validatedFields.success) {
      return {
        message: "Validation failed",
        fields: validatedFields.data,
        success: false,
      };
    }

    const newEvent = await addDoc(
      collection(db, "events"),
      validatedFields.data
    );

    if (!newEvent) {
      return {
        message: "Failed to create event",
        success: false,
      };
    }

    return {
      message: "Event created successfully",
      success: true,
    };
  } catch (e) {
    return { message: e.message, success: false };
  }
}

// update event
export async function updateEvent(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // update event

  try {
    const { userId } = await auth();
    if (!userId) {
      return { message: "You must be signed in to perform this action." };
    }
    const validatedFields = eventSchema
      .partial()
      .extend({
        id: z.string(),
      })
      .safeParse({
        id: formData.get("id"),
        name: formData.get("name"),
        description: formData.get("description"),
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
        status: formData.get("status"),
        prize1: formData.get("prize1"),
        prize2: formData.get("prize2"),
        prize3: formData.get("prize3"),
        prizeDescription1: formData.get("prizeDescription1"),
        prizeDescription2: formData.get("prizeDescription2"),
        prizeDescription3: formData.get("prizeDescription3"),
      });

    if (!validatedFields.success) {
      return {
        message: "Validation failed",
        fields: validatedFields.data,
        success: false,
      };
    }

    // update event
    await updateDoc(
      doc(db, "events", validatedFields.data.id),
      validatedFields.data
    );

    return {
      message: "Event updated successfully",
      success: true,
    };
  } catch (e) {
    return { message: e.message, success: false };
  }
}
// delete event

export async function deleteEvent(eventId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { message: "You must be signed in to perform this action." };
  }
  try {
    const event = doc(db, "events", eventId);

    if (!event) {
      return { message: "Event not found", success: false };
    }

    await deleteDoc(event);

    return { message: "Event deleted successfully", success: true };
  } catch (e) {
    return { message: e.message, success: false };
  }
}

export async function openEvent(eventId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { message: "You must be signed in to perform this action." };
  }
  try {
    const event = doc(db, "events", eventId);

    if (!event) {
      return { message: "Event not found", success: false };
    }

    await updateDoc(event, { isActive: true });

    return { message: "Event opened successfully", success: true };
  } catch (e) {
    return { message: e.message, success: false };
  }
}

export async function closeEvent(eventId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { message: "You must be signed in to perform this action." };
  }
  try {
    const event = doc(db, "events", eventId);

    if (!event) {
      return { message: "Event not found", success: false };
    }

    await updateDoc(event, { isActive: false });

    return { message: "Event closed successfully", success: true };
  } catch (e) {
    return { message: e.message, success: false };
  }
}

export async function completeEvent(eventId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { message: "You must be signed in to perform this action." };
  }
  try {
    const event = doc(db, "events", eventId);

    if (!event) {
      return { message: "Event not found", success: false };
    }

    // add winners to the event
    await updateDoc(event, { isCompleted: true });

    return { message: "Event completed successfully", success: true };
  } catch (e) {
    return { message: e.message, success: false };
  }
}

export async function resetEvent(eventId: string) {
  const { userId } = await auth();
  if (!userId) {
    return { message: "You must be signed in to perform this action." };
  }
  try {
    const event = doc(db, "events", eventId);

    if (!event) {
      return { message: "Event not found", success: false };
    }

    await updateDoc(event, { isCompleted: false });

    return { message: "Event reset successfully", success: true };
  } catch (e) {
    return { message: e.message, success: false };
  }
}

export async function addWinners(
  eventId: string,
  winners: {
    winner1: string | null;
    winner2: string | null;
    winner3: string | null;
  }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { message: "You must be signed in to perform this action." };
    }
    const event = doc(db, "events", eventId);

    if (!event) {
      return { message: "Event not found", success: false };
    }

    // no duplicates
    if (
      (winners.winner1 &&
        winners.winner2 &&
        winners.winner1 === winners.winner2) ||
      (winners.winner1 &&
        winners.winner3 &&
        winners.winner1 === winners.winner3) ||
      (winners.winner2 &&
        winners.winner3 &&
        winners.winner2 === winners.winner3)
    ) {
      return { message: "Duplicate winners", success: false };
    }

    await updateDoc(event, { ...winners, isCompleted: true });

    return { message: "Winners added successfully", success: true };
  } catch (e) {
    return { message: e.message, success: false };
  }
}

// get winners by using the event id as parameter and the winner1, winner2, winner3 as query for participants
export async function getWinners(eventId: string) {
  try {
    const event = doc(db, "events", eventId);

    if (!event) {
      return { message: "Event not found", success: false };
    }

    const eventData = await getDoc(event);
    const parsedEventData = {
      ...(eventData.data() as Event),
      id: eventData.id,
    };

    if (!parsedEventData.isCompleted) {
      return { message: "Event is not completed123", success: false };
    }

    const q = query(
      collection(db, "participants"),
      where("eventId", "==", eventId)
    );

    const participants =
      (await getDocs(q)).docs.map((doc) => {
        return { ...(doc.data() as Participant), id: doc.id };
      }) ?? [];

    const winner1 =
      (participants.find(
        (p) => p.id === parsedEventData.winner1
      ) as Participant) ?? null;
    const winner2 =
      (participants.find(
        (p) => p.id === parsedEventData.winner2
      ) as Participant) ?? null;
    const winner3 =
      (participants.find(
        (p) => p.id === parsedEventData.winner3
      ) as Participant) ?? null;

    return {
      data: {
        winner1,
        winner2,
        winner3,
      },
    };
  } catch (e) {
    return { message: e.message, success: false };
  }
}
