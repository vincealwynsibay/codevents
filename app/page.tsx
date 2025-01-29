import { getLatestActiveEvent } from "@/lib/actions/event.action";
import { Button } from "@/components/ui/button";
import ParticipantForm from "@/components/ParticipantForm";
import { isBefore, parseISO } from "date-fns";
import { getParticipants } from "@/lib/actions/participant.action";

export default async function Home() {
  const event = await getLatestActiveEvent();
  if (!event.data) return null;
  const participants = await getParticipants(event.data.id);
  console.log(event);

  return (
    <div>
      <div className="">
        <h1>{event.data.name}</h1>
        <p>{event.data.description}</p>
        <span>
          {event.data.isCompleted
            ? "Completed"
            : isBefore(parseISO(event.data.startDate), new Date())
            ? "Ongoing"
            : "Upcoming"}
        </span>
        <Button>
          <a href="#participantForm">Register Now</a>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="w-50 aspect-square bg-blue-600"></div>
        <div className="w-50 aspect-square bg-blue-600"></div>
        <div className="w-50 aspect-square bg-blue-600"></div>
      </div>

      <div className="lg:grid-cols-[300px_1fr]">
        <div id="participantForm" className="">
          {/* list of participants */}
          <h2>Participants</h2>
          <ul>
            {participants.data.map((participant) => (
              <li key={participant.id} className="flex items-center gap-2">
                <p>{participant.name}</p>
                <p>{participant.email}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* form for participant submission */}
        <ParticipantForm eventId={event.data.id} />
      </div>
    </div>
  );
}
