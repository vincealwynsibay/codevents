import Link from "next/link";
import { listPublicEvents } from "@/lib/server/data";
import { EVENT_TYPES, EVENT_TYPE_LABEL, EventType } from "@/lib/domain";
import EventCard from "@/components/events/EventCard";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Events" };

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; type?: string }>;
}) {
  const { view: rawView, type: rawType } = await searchParams;
  const view = rawView === "past" ? "past" : "upcoming";
  const type = EVENT_TYPES.includes(rawType as EventType) ? (rawType as EventType) : null;
  const { featured, upcoming, past } = await listPublicEvents();
  const all = view === "past" ? past : [...(featured ? [featured] : []), ...upcoming];
  const events = type ? all.filter((e) => e.type === type) : all;

  const tab = (v: string, label: string) => (
    <Link
      href={`/events?view=${v}${type ? `&type=${type}` : ""}`}
      className={cn(
        "rounded-md px-3 py-1.5 font-chakra text-sm transition-colors",
        view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="eyebrow">All events</p>
      <h1 className="mt-2 font-chakra text-4xl font-bold uppercase">{view === "past" ? "Past events" : "Upcoming"}</h1>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="panel flex gap-1 p-1">
          {tab("upcoming", "Upcoming")}
          {tab("past", "Past & winners")}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <FilterChip href={`/events?view=${view}`} active={!type} label="All" />
          {EVENT_TYPES.map((t) => (
            <FilterChip key={t} href={`/events?view=${view}&type=${t}`} active={type === t} label={EVENT_TYPE_LABEL[t] + "s"} />
          ))}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="panel mt-8 grid place-items-center px-6 py-16 text-center text-muted-foreground">
          {view === "past" ? "No past events yet." : "No upcoming events right now. Check back soon."}
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} showWinner={view === "past"} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 transition-colors",
        active ? "border-primary/60 bg-primary/15 text-blue-100" : "text-muted-foreground hover:border-white/30 hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}
