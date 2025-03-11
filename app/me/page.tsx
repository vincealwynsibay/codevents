import Link from "next/link";
import { redirect } from "next/navigation";
import { Award } from "lucide-react";
import { requireViewer } from "@/lib/server/auth";
import { getEventsByIds, getRegistrationsForUser } from "@/lib/server/data";
import { PHASE_LABEL, formatDate, formatTime, getPhase, isPast, profileNeedsUpdate, qrPayload } from "@/lib/domain";
import { DateBlock, Heading, wrap } from "@/components/home/HomeSections";
import { cn } from "@/lib/utils";
import TicketQr from "@/components/events/TicketQr";
import Avatar from "@/components/site/Avatar";

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

  const who = (viewer.profile?.name || viewer.user.name).split(" ")[0].toLowerCase();

  return (
    <div className={cn(wrap, "py-12")}>
      <p className="font-mono text-xs text-neutral-500">
        <span className="text-emerald-300">codes@umtc</span>:~$ whoami
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-5">
        <Avatar name={viewer.profile?.name || viewer.user.name} src={viewer.user.picture} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="font-chakra text-4xl font-bold uppercase leading-none tracking-tight text-white [text-shadow:3px_3px_0_#2a4aff] sm:text-5xl">
            {viewer.profile?.name || viewer.user.name}
          </h1>
          <p className="mt-2 font-mono text-xs text-neutral-500">
            {viewer.profile ? `${viewer.profile.course} · ${viewer.profile.yearLevel}` : viewer.user.email}
          </p>
        </div>
        <Link href="/onboarding?edit=1" className="rounded-md border border-white/15 px-3 py-2 font-mono text-xs text-neutral-300 hover:border-white/30 hover:text-white">
          edit profile
        </Link>
      </div>

      <dl className="mt-8 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02]">
        {[
          ["signed up", rows.length],
          ["attended", attended],
          ["podium", wins],
        ].map(([label, value]) => (
          <div key={label} className="px-5 py-4">
            <dd className="font-chakra text-3xl font-bold tabular-nums text-white">{value}</dd>
            <dt className="font-mono text-[11px] text-neutral-500">{label}</dt>
          </div>
        ))}
      </dl>

      <section className="mt-14">
        <Heading title="Tickets" />
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center font-mono text-sm text-neutral-500">
            no tickets yet.{" "}
            <Link href="/events" className="text-neutral-200 underline-offset-4 hover:underline">
              cd ~/events
            </Link>{" "}
            to find one.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {upcoming.map(({ reg, event, phase }) => (
              <div key={reg.id} className="grid gap-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:grid-cols-[1fr_auto]">
                <div className="flex gap-4">
                  <DateBlock iso={event.startDate} />
                  <div className="min-w-0 space-y-1.5">
                    <p className="flex items-center gap-2 text-xs text-neutral-500">
                      <span className={cn("size-1.5 rounded-full", phase === "REGISTRATION_OPEN" ? "bg-emerald-400" : phase === "ONGOING" ? "bg-blue-400" : "bg-amber-400")} />
                      {PHASE_LABEL[phase]}
                    </p>
                    <Link href={`/events/${event.id}`} className="block font-chakra text-xl font-bold leading-tight text-white hover:text-blue-200">
                      {event.title}
                    </Link>
                    <p className="text-xs text-neutral-500">
                      {formatTime(event.startDate)} · {event.venue}
                    </p>
                    <p className="pt-1 font-mono text-xs">
                      {reg.checkedInAt ? (
                        <span className="text-emerald-300">✓ checked in {formatTime(reg.checkedInAt)}</span>
                      ) : (
                        <span className="text-neutral-500">show the QR at the entrance</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="border-t border-dashed border-white/10 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                  <TicketQr value={qrPayload(reg)} size={140} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-14">
          <Heading title="History" />
          <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.02]">
            {past.map(({ reg, event, phase }) => {
              const win = event.winners.find((w) => w.refId === reg.id || w.refId === reg.teamId);
              return (
                <div key={reg.id} className="grid items-center gap-2 px-5 py-4 sm:grid-cols-[120px_1fr_auto_auto] sm:gap-5">
                  <span className="text-xs text-neutral-500">{formatDate(event.startDate)}</span>
                  <Link href={`/events/${event.id}`} className="font-chakra font-bold text-white hover:text-blue-200">
                    {event.title}
                  </Link>
                  <span className="font-mono text-xs text-neutral-500">
                    {phase === "CANCELLED" ? "cancelled" : reg.checkedInAt ? "attended" : "didn't check in"}
                    {win && (
                      <span className={cn("ml-2", ["", "text-amber-300", "text-neutral-300", "text-orange-300"][win.place])}>
                        · {["", "1st", "2nd", "3rd"][win.place]} place
                      </span>
                    )}
                  </span>
                  {reg.checkedInAt && phase !== "CANCELLED" ? (
                    <Link href={`/certificates/${reg.id}`} className="flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 font-mono text-xs text-neutral-300 hover:border-white/30 hover:text-white">
                      <Award className="size-3.5" /> certificate
                    </Link>
                  ) : (
                    <span />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
      <p className="mt-10 font-mono text-[11px] text-neutral-600">tip: `ticket` in the shell shows your QR too, {who}.</p>
    </div>
  );
}
