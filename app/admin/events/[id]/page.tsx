import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Download, ExternalLink, MapPin, Pencil, ScanLine } from "lucide-react";
import { getEvent, getRegistrationsForEvent, getTeamsForEvent } from "@/lib/server/data";
import { EVENT_TYPE_LABEL, PLACE_LABEL, formatRange, getPhase } from "@/lib/domain";
import PhaseBadge from "@/components/events/PhaseBadge";
import EventStatusControls from "@/components/admin/EventStatusControls";
import ParticipantsTable from "@/components/admin/ParticipantsTable";
import WinnersForm from "@/components/admin/WinnersForm";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Manage event" };

type Tab = "participants" | "teams" | "winners";

export default async function ManageEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const event = await getEvent(id);
  if (!event) notFound();
  const [registrations, teams] = await Promise.all([
    getRegistrationsForEvent(id),
    event.participation === "TEAM" ? getTeamsForEvent(id) : Promise.resolve([]),
  ]);
  const phase = getPhase(event);
  const checkedIn = registrations.filter((r) => r.checkedInAt).length;

  const tabs: { key: Tab; label: string }[] = [
    { key: "participants", label: `Participants (${registrations.length})` },
    ...(event.participation === "TEAM" ? [{ key: "teams" as Tab, label: `Teams (${teams.length})` }] : []),
    ...(event.prizes.length > 0 ? [{ key: "winners" as Tab, label: "Winners" }] : []),
  ];
  const tab: Tab = tabs.some((t) => t.key === rawTab) ? (rawTab as Tab) : "participants";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/events" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Events
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <PhaseBadge phase={phase} />
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {EVENT_TYPE_LABEL[event.type]} · {event.participation === "TEAM" ? `Teams of ${event.teamMin}–${event.teamMax}` : "Solo"}
              </span>
            </div>
            <h1 className="mt-2 font-chakra text-3xl font-bold">{event.title}</h1>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" /> {formatRange(event.startDate, event.endDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" /> {event.venue}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/events/${id}`} target="_blank">
                <ExternalLink /> Public page
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/events/${id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <EventStatusControls eventId={id} status={event.status} phase={phase} registrationCount={event.registrationCount} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Signed up" value={`${event.registrationCount}${event.capacity !== null ? ` / ${event.capacity}` : ""}`} />
        <Stat label="Checked in" value={`${checkedIn}`} sub={registrations.length ? `${Math.round((checkedIn / registrations.length) * 100)}%` : undefined} />
        {event.participation === "TEAM" ? (
          <Stat
            label="Teams"
            value={`${teams.length}`}
            sub={`${teams.filter((t) => t.memberUids.length < event.teamMin).length} incomplete`}
          />
        ) : (
          <Stat label="Courses" value={`${new Set(registrations.map((r) => r.course)).size}`} />
        )}
        <Stat
          label="Winners"
          value={event.prizes.length === 0 ? "—" : `${event.winners.length} / ${event.prizes.length}`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild className="font-chakra tracking-wide">
          <Link href={`/admin/events/${id}/check-in`}>
            <ScanLine /> Open check-in scanner
          </Link>
        </Button>
        <Button asChild variant="outline">
          <a href={`/admin/events/${id}/registrations.csv`}>
            <Download /> Export CSV
          </a>
        </Button>
      </div>

      <div className="border-b">
        <nav className="-mb-px flex gap-4 overflow-x-auto">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/admin/events/${id}?tab=${t.key}`}
              className={cn(
                "whitespace-nowrap border-b-2 px-1 pb-2 font-chakra text-sm transition-colors",
                tab === t.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      {tab === "participants" && (
        <ParticipantsTable
          registrations={registrations}
          teams={teams.map((t) => ({ id: t.id, name: t.name }))}
        />
      )}

      {tab === "teams" && (
        <div className="grid gap-3 md:grid-cols-2">
          {teams.length === 0 && <p className="text-sm text-muted-foreground">No teams yet.</p>}
          {teams.map((t) => {
            const members = registrations.filter((r) => r.teamId === t.id);
            const incomplete = t.memberUids.length < event.teamMin;
            return (
              <div key={t.id} className="panel p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-chakra text-lg font-bold">{t.name}</p>
                  <span className={cn("text-xs", incomplete ? "text-amber-300" : "text-emerald-300")}>
                    {t.memberUids.length}/{event.teamMax} {incomplete && "· incomplete"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Code <span className="font-chakra tracking-widest text-foreground">{t.code}</span>
                </p>
                <ul className="mt-3 space-y-1 text-sm">
                  {members.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2">
                      <span>
                        {m.name} {m.uid === t.captainUid && <span className="text-xs text-amber-300">(captain)</span>}
                      </span>
                      <span className={cn("text-xs", m.checkedInAt ? "text-emerald-300" : "text-muted-foreground")}>
                        {m.checkedInAt ? "checked in" : "not yet"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {tab === "winners" && (
        <WinnersForm
          eventId={id}
          prizes={event.prizes.map((p) => ({ place: p.place, label: `${PLACE_LABEL[p.place]} · ${p.title}` }))}
          current={event.winners.map((w) => ({ place: w.place, refId: w.refId }))}
          options={
            event.participation === "TEAM"
              ? teams.map((t) => ({ id: t.id, label: `${t.name} (${t.memberNames.join(", ")})` }))
              : registrations.map((r) => ({ id: r.id, label: `${r.name} · ${r.course}${r.checkedInAt ? "" : " · not checked in"}` }))
          }
        />
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="panel p-4">
      <p className="font-chakra text-2xl font-bold tabular-nums">
        {value} {sub && <span className="text-sm font-normal text-muted-foreground">{sub}</span>}
      </p>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}
