"use client";

import { Event, Participant } from "@/types/types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { motion } from "motion/react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { closeEvent, deleteEvent, openEvent } from "@/lib/actions/event.action";
import UpdateEventForm from "./UpdateEventForm";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { format, isBefore, parseISO } from "date-fns";
import WinnersForm from "./WinnersForm";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Pencil, Trash, X } from "lucide-react";
import Image from "next/image";
import { deleteParticipant } from "@/lib/actions/participant.action";
import { Input } from "./ui/input";

export default function EventItem({
  eventData,
  participants,
  winners,
}: {
  eventData: Event;
  participants: Participant[];
  winners:
    | {
        winner1: Participant;
        winner2: Participant;
        winner3: Participant;
      }
    | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [open3, setOpen3] = useState(false);
  const [participantsList, setParticipantsList] = useState(participants);
  const [participantQuery, setParticipantQuery] = useState("");
  const router = useRouter();

  const handleUpdate = () => {
    setOpen(() => false);
    setOpen2(() => false);
    router.refresh();
  };

  return (
    <div className="font-chakra border-white border-[1px] rounded-lg p-8">
      <div className="flex flex-row items-center justify-between flex-wrap">
        <h2 className="text-2xl font-bold">{eventData.name}</h2>

        <div className="flex flex-row items-center gap-2 flex-wrap">
          <Dialog open={open2} onOpenChange={(value) => setOpen2(value)}>
            <DialogTrigger asChild>
              <Button variant="ghost">
                <Pencil />
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95%] lg:max-w-4xl">
              <DialogHeader>
                <DialogTitle>Update Event</DialogTitle>
                <DialogDescription>
                  Update the event details below
                </DialogDescription>
              </DialogHeader>
              <UpdateEventForm
                eventData={eventData}
                handleUpdate={handleUpdate}
              />
            </DialogContent>
          </Dialog>

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost">
                <Trash />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  event.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    await deleteEvent(eventData.id);
                    router.refresh();
                  }}
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-row items-center gap-2">
          <Badge
            variant={eventData.isActive ? "default" : "outline"}
            className={cn(!eventData.isActive && "border-primary")}
          >
            {eventData.isActive ? "ACTIVE" : "INACTIVE"}
          </Badge>
          <Badge variant={"outline"}>
            {eventData.isCompleted
              ? "COMPLETED"
              : isBefore(parseISO(eventData.startDate), new Date())
              ? "ONGOING"
              : "UPCOMING"}
          </Badge>
        </div>

        <p>
          {format(parseISO(eventData.startDate), "PPP")}{" "}
          {format(parseISO(eventData.startDate), "p")} -{" "}
          {format(parseISO(eventData.endDate), "p")}
        </p>
        <p className="lg:w-1/2">{eventData.description}</p>
        <div className="">
          <h3 className="text-xl font-bold">Prizes</h3>

          <div className="flex flex-row items-center gap-4">
            {eventData.prize1 && (
              <div className="text-center ">
                <Image
                  className="mx-auto"
                  src={eventData.prize1}
                  alt="prize1"
                  width={50}
                  height={50}
                />
                <span className="text-sm text-[#aaaaaa]">
                  {eventData.prizeDescription1}
                </span>
              </div>
            )}
            {eventData.prize2 && (
              <div className="text-center ">
                <Image
                  className="mx-auto"
                  src={eventData.prize2}
                  alt="prize2"
                  width={50}
                  height={50}
                />
                <span className="text-sm text-[#aaaaaa]">
                  {eventData.prizeDescription2}
                </span>
              </div>
            )}
            {eventData.prize3 && (
              <div className="text-center ">
                <Image
                  className="mx-auto"
                  src={eventData.prize3}
                  alt="prize2"
                  width={50}
                  height={50}
                />
                <span className="text-sm text-[#aaaaaa]">
                  {eventData.prizeDescription3}
                </span>
              </div>
            )}
          </div>
        </div>
        {eventData.isCompleted && (
          <div className="">
            <h3 className="text-xl font-bold">Winners</h3>

            {winners && (
              <div className="flex flex-col gap-4">
                {winners.winner1 && <span>🥇 {winners.winner1.name}</span>}
                {winners.winner2 && <span>🥈 {winners.winner2.name}</span>}
                {winners.winner3 && <span>🥉 {winners.winner3.name}</span>}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-row mx-auto lg:mx-0 flex-wrap items-center justify-end gap-4">
          {eventData.isActive && (
            <Dialog open={open} onOpenChange={(value) => setOpen(value)}>
              <DialogTrigger asChild>
                <Button variant="default">
                  {eventData.isCompleted ? "RESET" : "COMPLETE"}
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95%] lg:max-w-4xl mx-auto">
                <DialogHeader>
                  <DialogTitle>Add Winners</DialogTitle>
                  <DialogDescription>
                    Add winners to the event below
                  </DialogDescription>
                </DialogHeader>
                <WinnersForm
                  event={eventData}
                  handleUpdate={handleUpdate}
                  participants={participants}
                />
              </DialogContent>
            </Dialog>
          )}

          {!eventData.isCompleted && (
            <Button
              onClick={async () => {
                if (eventData.isActive) {
                  await closeEvent(eventData.id);
                } else {
                  await openEvent(eventData.id);
                }
                router.refresh();
              }}
              variant={"secondary"}
            >
              {eventData.isActive ? "DEACTIVATE" : "ACTIVATE"}
            </Button>
          )}

          <Dialog open={open3} onOpenChange={(value) => setOpen3(value)}>
            <DialogTrigger asChild>
              <Button variant="default">Participants</Button>
            </DialogTrigger>
            <DialogContent className="w-[95%] lg:max-w-4xl">
              <DialogHeader className="flex flex-col gap-4">
                <DialogTitle className="mb-4">Participants List</DialogTitle>
                <Input
                  className="font-chakra "
                  value={participantQuery}
                  placeholder="Search participant name"
                  onChange={(event) => {
                    setParticipantQuery(event.target.value);
                    setParticipantsList(
                      participants.filter((participant) => {
                        return participant.name
                          .toLowerCase()
                          .includes(event.target.value.toLowerCase());
                      })
                    );
                  }}
                />
              </DialogHeader>

              <ul className="flex flex-col gap-4 overflow-y-auto max-h-80 pr-8">
                {participantsList.length === 0 && (
                  <p className="text-center">No participants found</p>
                )}
                {participantsList.map((participant) => (
                  <motion.li
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    key={participant.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex flex-col gap-2 text-left">
                      <p>{participant.name}</p>
                      <p className="text-[#aaaaaa] text-sm">
                        {participant.email}
                      </p>
                    </div>

                    <div className="">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost">
                            <X />
                            asda
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete the participant.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                deleteParticipant(participant.id);
                                setParticipantsList((prev) => {
                                  return prev.filter(
                                    (item) => item.id !== participant.id
                                  );
                                });
                                router.refresh();
                              }}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      {/* <Button
                        variant="ghost"
                        onClick={async () => {
                          deleteParticipant(participant.id);
                          setParticipantsList((prev) => {
                            return prev.filter(
                              (item) => item.id !== participant.id
                            );
                          });
                          router.refresh();
                        }}
                      >
                        <X />
                      </Button> */}
                    </div>
                  </motion.li>
                ))}
              </ul>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
