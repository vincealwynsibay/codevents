import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { CalendarPlus, Pencil } from "lucide-react";
import { getViewer } from "@/lib/server/auth";
import { getEvent, getRegistration, getRegistrationsForEvent, getTeam, getTeamsForEvent } from "@/lib/server/data";
import {
  EVENT_TYPE_LABEL,
  PHASE_LABEL,
  formatDateTime,
  formatRange,
  getPhase,
  isPast,
  profileNeedsUpdate,
  qrPayload,
  registrationId,
} from "@/lib/domain";
import { DateBlock, Heading, SpotsBar, Window, wrap } from "@/components/home/HomeSections";
import { cn } from "@/lib/utils";
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
    <div className={cn(wrap, "py-10")}>
      {viewer?.role && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-xs text-neutral-400">
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

      {/* Header, then the sign-up panel, then details on phones; panel in a sticky side column on desktop. */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-x-10 lg:gap-y-0">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <p className="font-mono text-xs text-neutral-500">
            <span className="text-emerald-300">codes@umtc</span>:~$ cd ~/{isPast(phase) ? "past" : "events"}/
            {event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}
          </p>
          <div data-anchor="event-header" className="mt-5 flex items-start gap-5">
            <DateBlock iso={event.startDate} big />
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    phase === "REGISTRATION_OPEN" ? "bg-emerald-400" : phase === "ONGOING" ? "bg-blue-400" : phase === "CANCELLED" ? "bg-red-400" : isPast(phase) ? "bg-neutral-500" : "bg-amber-400"
                  )}
                />
                {PHASE_LABEL[phase]} · {EVENT_TYPE_LABEL[event.type]} · {event.participation === "TEAM" ? `teams of ${event.teamMin}–${event.teamMax}` : "solo"}
              </p>
              <h1
                data-anchor="event-title"
                className="mt-2 font-chakra text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white [text-shadow:3px_3px_0_#2a4aff] sm:text-6xl"
              >
                {event.title}
              </h1>
              {event.tagline && <p className="mt-3 max-w-2xl text-base text-neutral-400">{event.tagline}</p>}
            </div>
          </div>

          <Window title="cat info.txt" className="mt-8">
            <dl className="grid gap-2 p-5 text-sm">
              {[
                ["when", formatRange(event.startDate, event.endDate)],
                ["where", event.venue],
                ...(event.registrationDeadline ? [["register by", formatDateTime(event.registrationDeadline)]] : []),
                ["spots", `${event.registrationCount} signed up${spotsLeft !== null ? ` · ${spotsLeft} left` : ""}`],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-4">
                  <dt className="w-24 shrink-0 text-neutral-500">{k}</dt>
                  <dd className="text-neutral-200">{v}</dd>
                </div>
              ))}
              {event.capacity !== null && (
                <div className="flex gap-4">
                  <dt className="w-24 shrink-0" />
                  <dd>
                    <SpotsBar n={event.registrationCount} cap={event.capacity} />
                  </dd>
                </div>
              )}
            </dl>
          </Window>
        </div>

        <aside className="space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-24 lg:self-start">
          {!isPast(phase) && phase !== "CANCELLED" && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
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
          <section className="lg:mt-12">
            <Heading title="About" />
            <div className="prose-event">{event.description}</div>
          </section>

          {event.prizes.length > 0 && (
            <section className="mt-12">
              <Heading title={event.winners.length > 0 ? "Winners" : phase === "AWAITING_RESULTS" ? "Prizes · results soon" : "Prizes"} />
              <Podium event={event} />
            </section>
          )}

          <section className="mt-12">
            <Heading title={event.participation === "TEAM" ? `Teams (${teams.length})` : `Who's going (${registrations.length})`} />
            {event.participation === "TEAM" ? (
              teams.length === 0 ? (
                <p className="text-sm text-muted-foreground">No teams yet. Be the first.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {teams.map((t) => (
                    <div key={t.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
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
                  <div key={r.id} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1 pr-3 text-sm">
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

