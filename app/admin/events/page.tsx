"use server";

import EventForm from "@/components/EventForm";
import EventItem from "@/components/EventItem";
import { getEvents, getWinners } from "@/lib/actions/event.action";
import { getParticipants } from "@/lib/actions/participant.action";

export default async function Page() {
  const events = await getEvents();

  if (!events.data) return null;

  const serverDate = new Date();
  return (
    <div className="max-w-7xl px-10 mx-auto">
      <div className="flex flex-row items-center justify-between mb-8">
        <h2 className="text-3xl font-bold font-chakra">Events</h2>
        <EventForm serverDate={serverDate} />
      </div>
      <div className="flex flex-col gap-4">
        {events.data.map(async (eventData) => {
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
