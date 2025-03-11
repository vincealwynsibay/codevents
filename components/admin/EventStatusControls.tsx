"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Lock, Loader2, Rocket, Trash2, Undo2, Unlock, XCircle } from "lucide-react";
import { EventStatus, Phase } from "@/lib/domain";
import { deleteEvent, duplicateEvent, setEventStatus } from "@/lib/actions/events";
import { Button } from "@/components/ui/button";
import ConfirmButton from "@/components/site/ConfirmButton";
import { toast } from "@/hooks/use-toast";

const hint: Record<Phase, string> = {
  DRAFT: "Only officers can see this draft. Open registration to publish it.",
  REGISTRATION_OPEN: "Students can sign up now.",
  REGISTRATION_CLOSED: "Published, but sign-ups are closed (manually, by deadline, or because it's full).",
  ONGOING: "The event is happening. Use the scanner to check people in.",
  AWAITING_RESULTS: "The event has ended. Pick the winners to complete it.",
  COMPLETED: "Done. Attendees can download their certificates.",
  CANCELLED: "Cancelled. Students see a cancelled notice.",
};

export default function EventStatusControls({
  eventId,
  status,
  phase,
  registrationCount,
}: {
  eventId: string;
  status: EventStatus;
  phase: Phase;
  registrationCount: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const beforeStart = phase === "DRAFT" || phase === "REGISTRATION_OPEN" || phase === "REGISTRATION_CLOSED";

  function change(next: EventStatus) {
    start(async () => {
      const res = await setEventStatus(eventId, next);
      toast(res.ok ? { title: res.message } : { title: res.error, variant: "destructive" });
      router.refresh();
    });
  }

  return (
    <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
      <p className="text-sm text-muted-foreground">
        {pending && <Loader2 className="mr-2 inline size-4 animate-spin" />}
        {hint[phase]}
      </p>
      <div className="flex flex-wrap gap-2">
        {status === "DRAFT" && (
          <Button size="sm" onClick={() => change("REGISTRATION_OPEN")} disabled={pending}>
            <Rocket /> Publish & open registration
          </Button>
        )}
        {status === "REGISTRATION_OPEN" && beforeStart && (
          <Button size="sm" variant="outline" onClick={() => change("REGISTRATION_CLOSED")} disabled={pending}>
            <Lock /> Close registration
          </Button>
        )}
        {status === "REGISTRATION_CLOSED" && beforeStart && (
          <Button size="sm" onClick={() => change("REGISTRATION_OPEN")} disabled={pending}>
            <Unlock /> Open registration
          </Button>
        )}
        {status === "CANCELLED" && (
          <Button size="sm" variant="outline" onClick={() => change(registrationCount > 0 ? "REGISTRATION_CLOSED" : "DRAFT")} disabled={pending}>
            <Undo2 /> Restore
          </Button>
        )}
        {status !== "DRAFT" && registrationCount === 0 && beforeStart && (
          <Button size="sm" variant="ghost" onClick={() => change("DRAFT")} disabled={pending}>
            <Undo2 /> Back to draft
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await duplicateEvent(eventId);
              if (!res.ok) return void toast({ title: res.error, variant: "destructive" });
              toast({ title: res.message });
              router.push(`/admin/events/${res.data!.id}/edit`);
            })
          }
        >
          <Copy /> Duplicate
        </Button>
        {status !== "CANCELLED" && status !== "DRAFT" && (
          <ConfirmButton
            size="sm"
            variant="ghost"
            title="Cancel this event?"
            description="Students will see it as cancelled. Registrations are kept, and you can restore it later."
            confirmLabel="Cancel event"
            onConfirm={() => change("CANCELLED")}
          >
            <XCircle /> Cancel event
          </ConfirmButton>
        )}
        <ConfirmButton
          size="sm"
          variant="ghost"
          className="text-red-400 hover:text-red-300"
          title="Delete this event for good?"
          description={`This removes the event${registrationCount ? `, its ${registrationCount} registrations and all teams` : ""}. It can't be undone.`}
          confirmLabel="Delete forever"
          onConfirm={async () => {
            const res = await deleteEvent(eventId);
            if (!res.ok) return void toast({ title: res.error, variant: "destructive" });
            toast({ title: res.message });
            router.push("/admin/events");
          }}
        >
          <Trash2 /> Delete
        </ConfirmButton>
      </div>
    </div>
  );
}
