"use client";
import EventForm from "@/components/EventForm";
import EventItem from "@/components/EventItem";
import { getWinners } from "@/lib/actions/event.action";
import { getParticipants } from "@/lib/actions/participant.action";
import { useAuth } from "@/lib/firebase/auth";
import { Event } from "@/types/types";
import { useRouter } from "next/navigation";

export default function EventsView({
  events,
  serverDate,
}: {
  events: Event[];
  serverDate: Date;
}) {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="max-w-7xl px-10 mx-auto">
      <div className="flex flex-row items-center justify-between mb-8">
        <h2 className="text-3xl font-bold font-chakra">Events</h2>
        <EventForm serverDate={serverDate} />
      </div>
      <div className="flex flex-col gap-4">
        {events.map(async (eventData) => {
          const participants = await getParticipants(eventData.id);
          const winners = await getWinners(eventData.id);

          return (
            <EventItem
              key={eventData.id}
              eventData={eventData}
              winners={winners.data}
              participants={participants.data ?? []}
            />
          );
        })}
      </div>
    </div>
  );
}
