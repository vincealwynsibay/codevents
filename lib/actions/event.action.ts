"use server";
import { z } from "zod";
import { db } from "./../firebase/clientApp";
import { EventPayload, eventSchema } from "./../validation";
import { FormState } from "@/types/types";
import {
  addDoc,
  updateDoc,
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
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

export async function getLatestPublishedEvent() {
  // get the latest event based on the start date and published status
  const q = query(
    collection(db, "events"),
    where("isPublished", "==", true),
    where("status", "==", "UPCOMING")
  );

  const events = (await getDocs(q)).docs.map((doc) => {
    return { ...(doc.data() as EventPayload), id: doc.id };
  });
  // sort events based on name
  const sortedEvents = events.sort((a, b) => {
    return isBefore(parseISO(a.startDate), parseISO(b.startDate)) ? 1 : -1;
  });

  return {
    data: sortedEvents.length > 0 ? sortedEvents[0] : null,
  };
}

export async function getPublishedEvents() {
  // get events
  // get only events with isPublished is true
  const q = query(collection(db, "events"), where("isPublished", "==", true));

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
