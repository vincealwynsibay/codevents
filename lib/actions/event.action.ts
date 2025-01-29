"use server";
import { z } from "zod";
import { db } from "./../firebase/clientApp";
import { EventPayload, eventSchema } from "./../validation";
import { Event, FormState } from "@/types/types";
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

// get events with sort and filter as parameter
export async function getEvents() {
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
  console.log();
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
    console.log(formData);
    const validatedFields = eventSchema.safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      status: formData.get("status"),
    });

    if (!validatedFields.success) {
      console.log(validatedFields.error);
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

    console.log(newEvent);
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
      });

    if (!validatedFields.success) {
      console.log(formData, validatedFields.error);
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
      return { message: "Event is not completed", success: false };
    }

    // it's possible to not have any winners only fetch those that the winner is not null

    const q = query(
      collection(db, "participants"),
      where("eventId", "==", eventId)
    );

    const participants = await getDocs(q);

    const winners = participants.docs.filter(
      (participant) =>
        participant.id === parsedEventData.winner1 ||
        participant.id === parsedEventData.winner2 ||
        participant.id === parsedEventData.winner3
    );

    return {
      data: winners.map((winner) => {
        return { ...(winner.data() as EventPayload), id: winner.id };
      }),
    };
  } catch (e) {
    return { message: e.message, success: false };
  }
}
