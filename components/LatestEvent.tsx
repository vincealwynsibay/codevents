"use client";
import { Event, Participant } from "@/types/types";
import Image from "next/image";
import EventParticipants from "./EventParticipants";
import { useEffect, useRef, useState } from "react";
import { isBefore } from "date-fns";
import { motion } from "motion/react";
import EventWinners from "./EventWinners";
import ScrambleButton from "./ScrambleButton";
import CountdownTimer from "./CountdownTimer";

export default function LatestEvent({
  event,
  participantsList,
  eventId,
  serverDate,
  winners,
}: {
  event: Event;
  participantsList: Participant[];
  eventId: string;
  serverDate: Date;
  winners:
    | {
        winner1: Participant;
        winner2: Participant;
        winner3: Participant;
      }
    | undefined;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const [displayText, setDisplayText] = useState(event.name);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  useEffect(() => {
    let iterations = 0;
    const originalText = event.name;

    const intervalId = setInterval(() => {
      setDisplayText((prevText) =>
        prevText
          .split("")
          .map((letter, index) => {
            if (index < iterations) {
              return originalText[index];
            }
            return letters[Math.floor(Math.random() * 26)];
          })
          .join("")
      );

      if (iterations >= originalText.length) {
        clearInterval(intervalId);
      }
      iterations += 1;
    }, 300 / originalText.length);
  }, [event.name]);

  const scrollRef = useRef(null);

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <div
          ref={scrollRef}
          className="font-chakra mx-8 border-white border-[1px] rounded-lg p-8 font-primary"
        >
          <div className="mx-auto bg-card rounded-lg px-10 py-2 w-fit text-[20px]">
            {event.isCompleted ? (
              <>
                <p>COMPLETED</p>
              </>
            ) : isBefore(serverDate, event.startDate) ? (
              <>
                <CountdownTimer destDate={event.startDate} />
              </>
            ) : (
              <>
                <p>ONGOING</p>
              </>
            )}
          </div>

          <div className="flex flex-col gap-8 md:grid md:grid-cols-2 md:gap-12 mt-8">
            <div className="flex flex-col gap-6">
              <div className="">
                <h1 className="text-7xl font-bold">{displayText}</h1>
                <Image
                  src={"/images/hackathon.png"}
                  className="w-[512px]"
                  alt="hackathon"
                  sizes="100vw"
                  width={0}
                  height={0}
                />
              </div>

              <div className="flex flex-col-reverse  md:grid md:grid-cols-2 gap-4">
                <div className="relative h-fit">
                  <ScrambleButton
                    className="py-8 w-full"
                    onClick={() => {
                      if (!!ref.current) {
                        ref.current?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    delay={200}
                    text={event.isCompleted ? "VIEW WINNERS" : "REGISTER NOW"}
                  />
                  <Image
                    src="/svg/cursor.svg"
                    className="absolute bottom-0 right-0 w-[24px] h-[24px] translate-y-1/2"
                    alt="cursor"
                    sizes="100vw"
                    width={0}
                    height={0}
                  />
                </div>

                <p className="text-[#aaaaaa]">{event.description}</p>
              </div>
            </div>

            <div className="grid place-items-center">
              <div className="grid grid-cols-6 grid-rows-2">
                <div className="text-center col-span col-start-1 col-end-3">
                  <Image
                    src={event.prize1}
                    className="mx-auto w-auto h-[100px]"
                    alt="1st prize"
                    sizes="100vw"
                    width={0}
                    height={0}
                  />
                  <p className="text-lg font-bold">1st Place</p>
                  <span className="text-sm text-[#aaaaaa]">
                    {event.prizeDescription1}
                  </span>
                </div>
                <div className="text-center col-start-5 col-end-7">
                  <Image
                    src={event.prize2}
                    className="mx-auto w-auto h-[100px]"
                    alt="1st prize"
                    sizes="100vw"
                    width={0}
                    height={0}
                  />
                  <p className="text-lg font-bold">2nd Place</p>
                  <span className="text-sm text-[#aaaaaa]">
                    {event.prizeDescription2}
                  </span>
                </div>
                <div className="text-center row-start-2 col-start-3 col-end-5 ">
                  <Image
                    src={event.prize3}
                    className="mx-auto w-auto h-[100px] border-[#b06e35]  "
                    alt="1st prize"
                    sizes="100vw"
                    width={0}
                    height={0}
                  />
                  <p className="text-lg font-bold">3rd Place</p>
                  <span className="text-sm text-[#aaaaaa]">
                    {event.prizeDescription3}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="" ref={scrollRef}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          {!!event.isCompleted ? (
            <>
              <EventWinners winners={winners} ref={ref} />
            </>
          ) : (
            <>
              {/* <EventWinners winners={winners} ref={ref} /> */}
              <EventParticipants
                participantsList={participantsList}
                eventId={eventId}
                ref={ref}
              />
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
