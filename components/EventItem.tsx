"use client";

import { Event, Participant } from "@/types/types";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
import { isBefore, parseISO } from "date-fns";
import WinnersForm from "./WinnersForm";

export default function EventItem({
  eventData,
  participants,
}: {
  eventData: Event;
  participants: Participant[];
}) {
  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  const router = useRouter();

  const handleUpdate = () => {
    setOpen(() => false);
    setOpen2(() => false);
    router.refresh();
  };

  return (
    <div>
      <h2>{eventData.name}</h2>
      <p>{eventData.description}</p>
      <span>{eventData.isActive ? "ACTIVE" : "INACTIVE"}</span>
      <span>
        {eventData.isCompleted
          ? "Completed"
          : isBefore(parseISO(eventData.startDate), new Date())
          ? "Ongoing"
          : "Upcoming"}
      </span>

      {/* onClick={async () => {
            console.log(eventData.isCompleted);
            if (eventData.isCompleted) {
              await resetEvent(eventData.id);
            } else {
              await completeEvent(eventData.id);
            }
            router.refresh();
          }} */}

      {eventData.isActive && (
        <Dialog open={open} onOpenChange={(value) => setOpen(value)}>
          <DialogTrigger asChild>
            <Button variant="outline">
              {eventData.isCompleted ? "RESET" : "COMPLETE"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
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
            <DialogFooter className="sm:justify-start">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
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
        >
          {eventData.isActive ? "DEACTIVATE" : "ACTIVATE"}
        </Button>
      )}

      <Dialog open={open2} onOpenChange={(value) => setOpen2(value)}>
        <DialogTrigger asChild>
          <Button variant="outline">Edit</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Event</DialogTitle>
            <DialogDescription>
              Update the event details below
            </DialogDescription>
          </DialogHeader>
          <UpdateEventForm eventData={eventData} handleUpdate={handleUpdate} />
          <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button>Delete</Button>
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
  );
}
