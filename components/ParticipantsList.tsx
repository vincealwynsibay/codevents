"use client";
import { Participant } from "@/types/types";
import { motion } from "motion/react";

export default function ParticipantsList({
  participants,
}: {
  participants: Participant[];
}) {
  return (
    <div
      id="participantForm"
      className="rounded-lg border-white border-[1px] p-10 font-primary flex flex-col gap-4"
    >
      {/* list of participants */}
      <h2 className="text-3xl">PARTICIPANTS</h2>
      <ul className="flex flex-col gap-4 overflow-y-auto max-h-80 ">
        {participants.map((participant) => (
          <motion.li
            key={participant.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex items-center justify-between"
          >
            <p>{participant.name}</p>
            <div className="flex items-center justify-end gap-1 ">
              <p>{participant.yearLevel} Year </p>
              <p>{participant.course}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
