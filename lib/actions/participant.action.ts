"use server";

import { FormState, Participant } from "@/types/types";
import { participantSchema } from "../validation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/clientApp";
import { auth } from "@clerk/nextjs/server";

export async function addParticipant(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const validatedFields = participantSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      eventId: formData.get("eventId"),
      yearLevel: formData.get("yearLevel"),
      course: formData.get("course"),
    });

    if (!validatedFields.success) {
      return {
        message: "Validation failed",
        fields: validatedFields.data,
        success: false,
      };
    }

    // check if email is already registered
    const q = query(
      collection(db, "participants"),
      where("email", "==", validatedFields.data.email)
    );
    const participants = await getDocs(q);

    if (participants.docs.length > 0) {
      return {
        message: "Email is already registered",
        success: false,
      };
    }

    // check if name is already registered
    const q2 = query(
      collection(db, "participants"),
      where("name", "==", validatedFields.data.name)
    );

    const participants2 = await getDocs(q2);

    if (participants2.docs.length > 0) {
      return {
        message: "Name is already registered",
        success: false,
      };
    }

    const newParticipant = await addDoc(collection(db, "participants"), {
      ...validatedFields.data,
      createdAt: new Date().toISOString(),
    });

    if (!newParticipant) {
      return {
        message: "Failed to create participant",
        success: false,
      };
    }

    return {
      message: "Participant created successfully",
      success: true,
    };
  } catch (e) {
    return { message: e.message, success: false };
  }
}

export async function getParticipants(eventId: string) {
  const q = query(
    collection(db, "participants"),
    where("eventId", "==", eventId),
    orderBy("createdAt", "desc")
  );
  const participants = await getDocs(q);

  return {
    data: participants.docs.map((doc) => {
      return { ...(doc.data() as Participant), id: doc.id };
    }),
  };
}

export async function deleteParticipant(id: string) {
  const { userId } = await auth();
  if (!userId) {
    return { message: "You must be signed in to perform this action." };
  }

  await deleteDoc(doc(db, "participants", id));

  return { message: "Participant deleted successfully" };
}
