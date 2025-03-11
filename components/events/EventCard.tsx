import Link from "next/link";
import { CalendarDays, MapPin, Trophy, Users } from "lucide-react";
import { CodEvent, EVENT_TYPE_LABEL, PLACE_LABEL, formatDateTime, getPhase } from "@/lib/domain";
import PhaseBadge from "./PhaseBadge";
import EventCover from "./EventCover";

export default function EventCard({ event, showWinner }: { event: CodEvent; showWinner?: boolean }) {
  const phase = getPhase(event);
  const champion = event.winners.find((w) => w.place === 1);
  return (
    <Link
      href={`/events/${event.id}`}
      className="group panel hud hud-hover flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_50px_-20px_rgba(42,74,255,0.6)]"
    >
      <div className="overflow-hidden rounded-t-xl">
        <EventCover event={event} className="aspect-[16/9] w-full transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <PhaseBadge phase={phase} />
          <span className="text-xs text-muted-foreground">{EVENT_TYPE_LABEL[event.type]}</span>
        </div>
        <h3 className="font-chakra text-lg font-bold leading-tight group-hover:text-blue-200">{event.title}</h3>
        {event.tagline && <p className="line-clamp-2 text-sm text-muted-foreground">{event.tagline}</p>}
        <div className="mt-auto space-y-1.5 border-t border-dashed border-white/10 pt-3 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <CalendarDays className="size-3.5" /> {formatDateTime(event.startDate)}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="size-3.5" /> <span className="truncate">{event.venue}</span>
          </p>
          {showWinner && champion ? (
            <p className="flex items-center gap-2 text-amber-300">
              <Trophy className="size-3.5" /> {PLACE_LABEL[1]}: {champion.name}
            </p>
          ) : (
            <p className="flex items-center gap-2">
              <Users className="size-3.5" />
              {event.registrationCount} {event.participation === "TEAM" ? "participants in teams" : "signed up"}
              {event.capacity !== null && ` / ${event.capacity}`}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
