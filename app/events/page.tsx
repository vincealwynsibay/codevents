import Link from "next/link";
import { listPublicEvents } from "@/lib/server/data";
import { EVENT_TYPES, EVENT_TYPE_LABEL, EventType } from "@/lib/domain";
import { EventDateCard, PodiumRows, wrap } from "@/components/home/HomeSections";
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
  const cmd = `ls ${view === "past" ? "~/past" : "~/events"}${type ? ` --type=${type.toLowerCase()}` : ""}`;

  const tab = (v: string, label: string) => (
    <Link
      href={`/events?view=${v}${type ? `&type=${type}` : ""}`}
      className={cn(
        "rounded-md px-3 py-1.5 font-chakra text-sm uppercase tracking-wide transition-colors",
        view === v ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white"
      )}
    >
      {label}
    </Link>
  );

  return (
    <div className={cn(wrap, "py-12")}>
      <p className="font-mono text-xs text-neutral-500">
        <span className="text-emerald-300">codes@umtc</span>:~$ {cmd}
      </p>
      <h1 className="mt-3 font-chakra text-5xl font-bold uppercase leading-none tracking-tight text-white [text-shadow:3px_3px_0_#2a4aff] sm:text-6xl">
        {view === "past" ? "Hall of fame" : "Events"}
      </h1>
      <p className="mt-3 text-sm text-neutral-400">
        {view === "past"
          ? "Every event CODES has run, and who took the podium."
          : `${events.length} ${events.length === 1 ? "event" : "events"} on the calendar. Sign up with your school account.`}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex gap-1">
          {tab("upcoming", "Upcoming")}
          {tab("past", "Past & winners")}
        </div>
        <div className="flex flex-wrap gap-1.5 font-mono text-xs">
          <FilterChip href={`/events?view=${view}`} active={!type} label="all" />
          {EVENT_TYPES.map((t) => (
            <FilterChip key={t} href={`/events?view=${view}&type=${t}`} active={type === t} label={EVENT_TYPE_LABEL[t].toLowerCase() + "s"} />
          ))}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center font-mono text-sm text-neutral-500">
          {view === "past" ? "no past events yet." : "nothing scheduled. check back soon."}
        </div>
      ) : view === "past" ? (
        <div className="mt-8">
          <PodiumRows events={events} />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((e) => (
            <EventDateCard key={e.id} event={e} />
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
        "rounded-md border px-2.5 py-1 transition-colors",
        active ? "border-white/30 bg-white/10 text-white" : "border-white/10 text-neutral-500 hover:border-white/25 hover:text-white"
      )}
    >
      {label}
    </Link>
  );
}
