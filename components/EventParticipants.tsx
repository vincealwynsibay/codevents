"use client";

import { RefObject, useState } from "react";
import ParticipantForm from "./ParticipantForm";
import ParticipantsList from "./ParticipantsList";
import { Participant } from "@/types/types";

export default function EventParticipants({
  participantsList,
  eventId,
  ref,
}: {
  participantsList: Participant[];
  eventId: string;
  ref: RefObject<HTMLDivElement | null>;
}) {
  const [participants, setParticipants] = useState(participantsList);

  const handleAddParticipant = (newParticipant: Participant) => {
    setParticipants((prev) => [
      { ...newParticipant, id: newParticipant.email },
      ...prev,
    ]);
  };

  return (
    <div className="max-w-7xl mx-auto mt-8">
      <div
        className="mx-8 flex flex-col  gap-8 font-chakra md:grid md:grid-cols-[400px,_1fr] "
        ref={ref}
      >
        <ParticipantsList participants={participants} />
        <ParticipantForm
          eventId={eventId}
          handleAddParticipant={handleAddParticipant}
        />
      </div>
    </div>
  );
}
