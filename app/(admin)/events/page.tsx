import EventForm from "@/components/EventForm";
import EventItem from "@/components/EventItem";
import { getEvents } from "@/lib/actions/event.action";

export default async function Page() {
  const events = await getEvents();

  if (!events.data) return null;

  const serverDate = new Date();
  return (
    <div>
      <EventForm serverDate={serverDate} />
      {events.data.map((eventData) => (
        <EventItem key={eventData.id} eventData={eventData} />
      ))}
    </div>
  );
}
