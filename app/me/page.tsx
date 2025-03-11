import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, CalendarDays, MapPin } from "lucide-react";
import { requireViewer } from "@/lib/server/auth";
import { getEventsByIds, getRegistrationsForUser } from "@/lib/server/data";
import { formatDateTime, getPhase, isPast, profileNeedsUpdate, qrPayload } from "@/lib/domain";
import PhaseBadge from "@/components/events/PhaseBadge";
import TicketQr from "@/components/events/TicketQr";
import Avatar from "@/components/site/Avatar";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "My events" };

export default async function MyEventsPage() {
  const viewer = await requireViewer("/me");
  if (profileNeedsUpdate(viewer.profile) && !viewer.role) redirect("/onboarding?next=/me");

  const regs = await getRegistrationsForUser(viewer.user.uid);
  const events = await getEventsByIds(regs.map((r) => r.eventId));
  const rows = regs
    .map((reg) => ({ reg, event: events.find((e) => e.id === reg.eventId)! }))
    .filter((r) => r.event)
    .map((r) => ({ ...r, phase: getPhase(r.event) }));

  const upcoming = rows
    .filter((r) => !isPast(r.phase) && r.phase !== "CANCELLED")
    .sort((a, b) => a.event.startDate.localeCompare(b.event.startDate));
  const past = rows
    .filter((r) => isPast(r.phase) || r.phase === "CANCELLED")
    .sort((a, b) => b.event.startDate.localeCompare(a.event.startDate));
  const attended = past.filter((r) => r.reg.checkedInAt).length;
  const wins = past.filter((r) => r.event.winners.some((w) => w.refId === r.reg.id || w.refId === r.reg.teamId)).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={viewer.profile?.name || viewer.user.name} src={viewer.user.picture} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="font-chakra text-3xl font-bold">{viewer.profile?.name || viewer.user.name}</h1>
          <p className="text-sm text-muted-foreground">
            {viewer.profile ? `${viewer.profile.course} · ${viewer.profile.yearLevel}` : viewer.user.email}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/onboarding?edit=1">Edit profile</Link>
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3">
        <Stat label="Signed up" value={rows.length} />
        <Stat label="Attended" value={attended} />
        <Stat label="Podium finishes" value={wins} />
      </div>

      <section className="mt-12">
        <h2 className="font-chakra text-xl font-bold uppercase">Upcoming tickets</h2>
        {upcoming.length === 0 ? (
          <div className="panel mt-4 px-6 py-10 text-center text-muted-foreground">
            You haven&apos;t signed up for anything yet.{" "}
            <Link href="/events" className="text-blue-300 hover:underline">
              Browse events
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {upcoming.map(({ reg, event, phase }) => (
              <div key={reg.id} className="panel grid gap-5 p-5 sm:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <PhaseBadge phase={phase} />
                  <Link href={`/events/${event.id}`} className="block font-chakra text-2xl font-bold hover:text-blue-200">
                    {event.title}
                  </Link>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="size-4" /> {formatDateTime(event.startDate)}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4" /> {event.venue}
                  </p>
                  <p className="pt-2 text-sm">
                    {reg.checkedInAt ? (
                      <span className="text-emerald-300">Checked in at {formatDateTime(reg.checkedInAt)}</span>
                    ) : (
                      <span className="text-muted-foreground">Show the QR code at the entrance to check in.</span>
                    )}
                  </p>
                </div>
                <div className="sm:w-[180px]">
                  <TicketQr value={qrPayload(reg)} size={170} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-12">
          <h2 className="font-chakra text-xl font-bold uppercase">History</h2>
          <div className="panel mt-4 divide-y">
            {past.map(({ reg, event, phase }) => {
              const win = event.winners.find((w) => w.refId === reg.id || w.refId === reg.teamId);
              return (
                <div key={reg.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <Link href={`/events/${event.id}`} className="font-medium hover:text-blue-200">
                      {event.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(event.startDate)} ·{" "}
                      {phase === "CANCELLED" ? "Cancelled" : reg.checkedInAt ? "Attended" : "Didn't check in"}
                      {win && <span className="text-amber-300"> · {["", "1st", "2nd", "3rd"][win.place]} place 🏆</span>}
                    </p>
                  </div>
                  {reg.checkedInAt && phase !== "CANCELLED" && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/certificates/${reg.id}`}>
                        <Award /> Certificate
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel p-4">
      <p className="font-chakra text-3xl font-bold">{value}</p>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}
