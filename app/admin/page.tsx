import Link from "next/link";
import { AlertTriangle, ArrowRight, Plus } from "lucide-react";
import { listAllEvents, getRegistrationsForEvent } from "@/lib/server/data";
import { CodEvent, formatDateTime, getPhase, isPast } from "@/lib/domain";
import PhaseBadge from "@/components/events/PhaseBadge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Admin" };

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const events = await listAllEvents();
  const withPhase = events.map((e) => ({ event: e, phase: getPhase(e) }));

  const active = withPhase
    .filter(({ phase }) => ["REGISTRATION_OPEN", "REGISTRATION_CLOSED", "ONGOING"].includes(phase))
    .sort((a, b) => a.event.startDate.localeCompare(b.event.startDate));
  const awaiting = withPhase.filter(({ phase }) => phase === "AWAITING_RESULTS");
  const drafts = withPhase.filter(({ phase }) => phase === "DRAFT");
  const lastPast = withPhase
    .filter(({ phase }) => isPast(phase))
    .sort((a, b) => b.event.startDate.localeCompare(a.event.startDate))[0];

  let attendance: { checkedIn: number; total: number } | null = null;
  if (lastPast) {
    const regs = await getRegistrationsForEvent(lastPast.event.id);
    attendance = { checkedIn: regs.filter((r) => r.checkedInAt).length, total: regs.length };
  }
  const totalSignups = events.reduce((sum, e) => sum + e.registrationCount, 0);

  return (
    <div className="space-y-8">
      {error === "owner-only" && (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          Only owners can manage officers.
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-1 font-chakra text-3xl font-bold">Hello, officer.</h1>
        </div>
        <Button asChild className="font-chakra tracking-wide">
          <Link href="/admin/events/new">
            <Plus /> New event
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Events" value={events.length} />
        <Stat label="Live / upcoming" value={active.length} />
        <Stat label="Total sign-ups" value={totalSignups} />
        <Stat
          label={lastPast ? `Attendance · ${lastPast.event.title}` : "Last attendance"}
          value={attendance && attendance.total > 0 ? `${Math.round((attendance.checkedIn / attendance.total) * 100)}%` : "—"}
        />
      </div>

      {awaiting.length > 0 && (
        <section className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
          <p className="flex items-center gap-2 font-medium text-violet-200">
            <AlertTriangle className="size-4" /> Needs winners
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {awaiting.map(({ event }) => (
              <li key={event.id}>
                <Link href={`/admin/events/${event.id}?tab=winners`} className="text-violet-100 underline-offset-4 hover:underline">
                  {event.title}
                </Link>{" "}
                <span className="text-violet-200/70">ended {formatDateTime(event.endDate)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <EventList title="Live & upcoming" rows={active} empty="Nothing scheduled. Create an event to get started." />
      {drafts.length > 0 && <EventList title="Drafts" rows={drafts} empty="" />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="panel relative overflow-hidden p-4">
      <div className="dot-bg pointer-events-none absolute -right-4 -top-4 size-20 opacity-30 [mask-image:radial-gradient(circle,black,transparent_70%)]" />
      <p className="relative font-chakra text-3xl font-bold tabular-nums">{value}</p>
      <p className="truncate text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function EventList({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { event: CodEvent; phase: ReturnType<typeof getPhase> }[];
  empty: string;
}) {
  return (
    <section>
      <h2 className="section-label mb-4">{title}</h2>
      {rows.length === 0 ? (
        <div className="panel px-6 py-10 text-center text-sm text-muted-foreground">{empty}</div>
      ) : (
        <div className="panel divide-y">
          {rows.map(({ event, phase }) => (
            <Link
              key={event.id}
              href={`/admin/events/${event.id}`}
              className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-white/[0.03]"
            >
              <div className="min-w-0 flex-1 basis-full sm:basis-0">
                <p className="font-medium">{event.title}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(event.startDate)} · {event.venue}</p>
              </div>
              <span className="text-sm tabular-nums text-muted-foreground">
                {event.registrationCount}
                {event.capacity !== null && `/${event.capacity}`} signed up
              </span>
              <PhaseBadge phase={phase} />
              <ArrowRight className="ml-auto size-4 text-muted-foreground sm:ml-0" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
