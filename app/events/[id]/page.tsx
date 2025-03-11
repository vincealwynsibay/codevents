import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, CalendarPlus, Clock, MapPin, Pencil, Users } from "lucide-react";
import { getViewer } from "@/lib/server/auth";
import { getEvent, getRegistration, getRegistrationsForEvent, getTeam, getTeamsForEvent } from "@/lib/server/data";
import {
  EVENT_TYPE_LABEL,
  formatDateTime,
  formatRange,
  getPhase,
  isPast,
  profileNeedsUpdate,
  qrPayload,
  registrationId,
} from "@/lib/domain";
import EventCover from "@/components/events/EventCover";
import PhaseBadge from "@/components/events/PhaseBadge";
import Countdown from "@/components/events/Countdown";
import Podium from "@/components/events/Podium";
import RegisterPanel, { RegisterState } from "@/components/events/RegisterPanel";
import TicketQr from "@/components/events/TicketQr";
import Avatar from "@/components/site/Avatar";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event || event.status === "DRAFT") return { title: "Event" };
  return { title: event.title, description: event.tagline || event.description.slice(0, 160) };
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, viewer] = await Promise.all([getEvent(id), getViewer()]);
  if (!event) notFound();
  if (event.status === "DRAFT" && !viewer?.role) notFound();

  const phase = getPhase(event);
  const [registrations, teams, myReg] = await Promise.all([
    getRegistrationsForEvent(id),
    event.participation === "TEAM" ? getTeamsForEvent(id) : Promise.resolve([]),
    viewer ? getRegistration(registrationId(id, viewer.user.uid)) : Promise.resolve(null),
  ]);
  const myTeam = myReg?.teamId ? await getTeam(myReg.teamId) : null;

  let state: RegisterState;
  if (!viewer) state = { kind: "anon" };
  else if (myReg)
    state = {
      kind: "registered",
      checkedIn: !!myReg.checkedInAt,
      team: myTeam
        ? {
            name: myTeam.name,
            code: myTeam.code,
            members: myTeam.memberNames,
            isCaptain: myTeam.captainUid === viewer.user.uid,
          }
        : null,
    };
  else if (profileNeedsUpdate(viewer.profile)) state = { kind: "needsProfile" };
  else state = { kind: "eligible" };

  const spotsLeft = event.capacity !== null ? Math.max(0, event.capacity - event.registrationCount) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {viewer?.role && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm">
          <span>
            You&apos;re viewing this as an officer{event.status === "DRAFT" && " · this draft is hidden from students"}.
          </span>
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/events/${event.id}`}>
              <Pencil /> Manage event
            </Link>
          </Button>
        </div>
      )}

      <EventCover event={event} variant="banner" className="aspect-[21/9] max-h-[360px] min-h-[160px] w-full rounded-xl border" />

      {/* Header, then the sign-up panel, then details on phones; panel in a sticky side column on desktop. */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-x-10 lg:gap-y-0">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <div className="flex flex-wrap items-center gap-2">
            <PhaseBadge phase={phase} />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {EVENT_TYPE_LABEL[event.type]} · {event.participation === "TEAM" ? `Teams of ${event.teamMin}–${event.teamMax}` : "Solo"}
            </span>
          </div>
          <h1 className="mt-3 font-chakra text-4xl font-bold uppercase leading-tight sm:text-5xl">{event.title}</h1>
          {event.tagline && <p className="mt-3 text-lg text-muted-foreground">{event.tagline}</p>}

          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <Info icon={<CalendarDays />} label="When" value={formatRange(event.startDate, event.endDate)} />
            <Info icon={<MapPin />} label="Where" value={event.venue} />
            {event.registrationDeadline && (
              <Info icon={<Clock />} label="Register by" value={formatDateTime(event.registrationDeadline)} />
            )}
            <Info
              icon={<Users />}
              label="Spots"
              value={`${event.registrationCount} signed up${spotsLeft !== null ? ` · ${spotsLeft} left` : ""}`}
            />
          </div>

        </div>

        <aside className="space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-24 lg:self-start">
          {!isPast(phase) && phase !== "CANCELLED" && (
            <div className="panel p-5">
              <Countdown
                to={phase === "ONGOING" ? event.endDate : event.startDate}
                label={phase === "ONGOING" ? "Ends in" : "Starts in"}
              />
            </div>
          )}
          <RegisterPanel
            eventId={event.id}
            phase={phase}
            participation={event.participation}
            teamMin={event.teamMin}
            teamMax={event.teamMax}
            state={state}
            ticket={
              myReg && !isPast(phase) && phase !== "CANCELLED" ? (
                <TicketQr value={qrPayload(myReg)} />
              ) : null
            }
            certificateHref={myReg && myReg.checkedInAt && isPast(phase) ? `/certificates/${myReg.id}` : null}
          />
          {!isPast(phase) && phase !== "CANCELLED" && (
            <Button asChild variant="outline" className="w-full">
              <a href={`/events/${event.id}/calendar.ics`}>
                <CalendarPlus /> Add to calendar
              </a>
            </Button>
          )}
        </aside>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <section className="lg:mt-10">
            <h2 className="eyebrow mb-3">About</h2>
            <div className="prose-event">{event.description}</div>
          </section>

          {event.prizes.length > 0 && (
            <section className="mt-12">
              <h2 className="eyebrow mb-4">
                {event.winners.length > 0 ? "Winners" : phase === "AWAITING_RESULTS" ? "Prizes · results coming soon" : "Prizes"}
              </h2>
              <Podium event={event} />
            </section>
          )}

          <section className="mt-12">
            <h2 className="eyebrow mb-4">
              {event.participation === "TEAM" ? `Teams (${teams.length})` : `Who's going (${registrations.length})`}
            </h2>
            {event.participation === "TEAM" ? (
              teams.length === 0 ? (
                <p className="text-sm text-muted-foreground">No teams yet. Be the first.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {teams.map((t) => (
                    <div key={t.id} className="panel p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-chakra font-bold">{t.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {t.memberNames.length}/{event.teamMax}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{t.memberNames.join(", ")}</p>
                    </div>
                  ))}
                </div>
              )
            ) : registrations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one yet. Be the first.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {registrations.slice(0, 60).map((r) => (
                  <div key={r.id} className="flex items-center gap-2 rounded-full border bg-card/60 py-1 pl-1 pr-3 text-sm">
                    <Avatar name={r.name} src={r.photoURL} size={24} />
                    <span>{r.name}</span>
                  </div>
                ))}
                {registrations.length > 60 && (
                  <span className="self-center text-sm text-muted-foreground">+{registrations.length - 60} more</span>
                )}
              </div>
            )}
          </section>
        </div>

      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="panel flex items-start gap-3 p-3">
      <span className="mt-0.5 text-primary [&_svg]:size-4">{icon}</span>
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-foreground">{value}</p>
      </div>
    </div>
  );
}
