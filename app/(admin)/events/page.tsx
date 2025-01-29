import EventForm from "@/components/EventForm";
import EventItem from "@/components/EventItem";
import { getEvents, getWinners } from "@/lib/actions/event.action";
import { getParticipants } from "@/lib/actions/participant.action";

export default async function Page() {
  const events = await getEvents();

  if (!events.data) return null;

  const serverDate = new Date();
  return (
    <div>
      <EventForm serverDate={serverDate} />
      {events.data.map(async (eventData) => {
        const participants = await getParticipants(eventData.id);
        const winners = await getWinners(eventData.id);
        console.log(winners);

        return (
          <EventItem
            key={eventData.id}
            eventData={eventData}
            participants={participants.data ?? []}
          />
        );
      })}
    </div>
  );
}
