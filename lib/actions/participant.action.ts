"use server";

import { FormState, Participant } from "@/types/types";
import { participantSchema } from "../validation";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/clientApp";

export async function addParticipant(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    console.log(formData);
    const validatedFields = participantSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      eventId: formData.get("eventId"),
    });

    if (!validatedFields.success) {
      console.log(validatedFields.error);
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

    const newParticipant = await addDoc(
      collection(db, "participants"),
      validatedFields.data
    );

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
    where("eventId", "==", eventId)
  );
  const participants = await getDocs(q);

  return {
    data: participants.docs.map((doc) => {
      return { ...(doc.data() as Participant), id: doc.id };
    }),
  };
}
