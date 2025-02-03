import { getLatestActiveEvent, getWinners } from "@/lib/actions/event.action";
import { getParticipants } from "@/lib/actions/participant.action";
import LatestEvent from "@/components/LatestEvent";
export const dynamic = "force-dynamic";
export default async function Home() {
  const event = await getLatestActiveEvent();
  if (!event.data) return null;
  const participants = await getParticipants(event.data.id);
  if (!participants.data) return null;

  const winners = await getWinners(event.data.id);
  // if (!participants.data) return null;
  // if (!winners.data) return null;

  const serverDate = new Date();
  return (
    <div>
      <LatestEvent
        event={event.data}
        participantsList={participants.data}
        eventId={event.data.id}
        winners={winners.data}
        serverDate={serverDate}
      />
    </div>
  );
}
