import Link from "next/link";
import { Press_Start_2P } from "next/font/google";
import { ArrowRight } from "lucide-react";
import { CodEvent, EVENT_TYPE_LABEL, PHASE_LABEL, formatDate, formatRange, formatTime, getPhase } from "@/lib/domain";
import Countdown from "@/components/events/Countdown";
import { cn } from "@/lib/utils";

/*
  Two directions for everything below the home hero. Both drop the generated
  cover art and stay quiet so the shell hero leads.
    A · SectionsShell  — the sections read like the terminal (cat, ls -l, git log)
    B · SectionsCards  — clean, typographic cards with a big date block
*/

const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], display: "swap" });
type Props = { featured: CodEvent | null; upcoming: CodEvent[]; past: CodEvent[] };

const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
export const wrap = "mx-auto max-w-[92rem] px-4 sm:px-6 lg:px-10";

const TAG: Record<string, { text: string; cls: string }> = {
  REGISTRATION_OPEN: { text: "OPEN", cls: "text-emerald-300" },
  REGISTRATION_CLOSED: { text: "CLOSED", cls: "text-amber-300" },
  ONGOING: { text: "LIVE", cls: "text-blue-300" },
  AWAITING_RESULTS: { text: "JUDGING", cls: "text-violet-300" },
  COMPLETED: { text: "DONE", cls: "text-neutral-500" },
  CANCELLED: { text: "CANCELLED", cls: "text-red-400" },
  DRAFT: { text: "DRAFT", cls: "text-neutral-500" },
};

function asciiBar(n: number, cap: number | null, width = 14) {
  if (!cap) return `${n} signed up`;
  const filled = Math.min(width, Math.round((n / cap) * width));
  return `[${"█".repeat(filled)}${"░".repeat(width - filled)}] ${n}/${cap}`;
}

export function RegisterButton({ event, label }: { event: CodEvent; label: string }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className={`${pixel.className} inline-block rounded-md bg-amber-300 px-4 py-3 text-[10px] text-black shadow-[0_4px_0_0_#b45309] transition-transform hover:-translate-y-px active:translate-y-0.5 active:shadow-none`}
    >
      ▶ {label}
    </Link>
  );
}

export function Window({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div data-anchor={`win-${slug(title)}`} className={cn("overflow-hidden rounded-2xl border border-white/10 bg-black/50 font-mono backdrop-blur", className)}>
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="ml-2 truncate text-xs text-neutral-500">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ===========================================================================
// A · Shell listings
// ===========================================================================
export function SectionsShell({ featured, upcoming, past }: Props) {
  const phase = featured ? getPhase(featured) : null;
  return (
    <div className={cn(wrap, "space-y-14 pt-14")}>
      {featured && phase && (
        <Window title={`codes@umtc: ~/events/${slug(featured.title)}`}>
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <p className="text-xs text-neutral-500">
                <span className="text-emerald-300">$</span> cat next.txt
              </p>
              <h2 className="mt-4 font-chakra text-3xl font-bold uppercase leading-tight text-white sm:text-5xl">{featured.title}</h2>
              {featured.tagline && <p className="mt-3 text-sm text-neutral-400">{featured.tagline}</p>}
              <dl className="mt-6 grid gap-1.5 text-sm">
                {[
                  ["status", <span key="s" className={TAG[phase]?.cls}>{PHASE_LABEL[phase].toLowerCase()}</span>],
                  ["type", EVENT_TYPE_LABEL[featured.type].toLowerCase()],
                  ["when", formatRange(featured.startDate, featured.endDate)],
                  ["where", featured.venue],
                  ["spots", <span key="b" className="text-blue-300">{asciiBar(featured.registrationCount, featured.capacity)}</span>],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex gap-4">
                    <dt className="w-16 shrink-0 text-neutral-500">{k}</dt>
                    <dd className="text-neutral-200">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <RegisterButton event={featured} label={phase === "REGISTRATION_OPEN" ? "REGISTER" : "VIEW"} />
                <span className="text-xs text-neutral-500">
                  or in the shell: <span className="text-neutral-300">cd ~/events/{slug(featured.title)} &amp;&amp; register</span>
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-6">
              <Countdown to={phase === "ONGOING" ? featured.endDate : featured.startDate} label={phase === "ONGOING" ? "ends in" : "starts in"} />
            </div>
          </div>
        </Window>
      )}

      {upcoming.length > 0 && (
        <Window title="codes@umtc: ~/events — ls -l">
          <div className="p-4 sm:p-6">
            <p className="mb-3 text-xs text-neutral-500">
              <span className="text-emerald-300">$</span> ls -l ~/events
            </p>
            <div className="divide-y divide-white/5">
              {upcoming.map((e) => {
                const p = getPhase(e);
                return (
                  <Link
                    key={e.id}
                    href={`/events/${e.id}`}
                    className="group grid grid-cols-[70px_1fr] items-baseline gap-x-4 gap-y-1 rounded-md px-2 py-3 text-sm transition-colors hover:bg-white/[0.04] sm:grid-cols-[90px_110px_1fr_200px_140px_20px]"
                  >
                    <span className={cn("text-xs", TAG[p]?.cls)}>[{TAG[p]?.text}]</span>
                    <span className="hidden text-neutral-500 sm:block">{formatDate(e.startDate, { year: undefined, weekday: "short" })}</span>
                    <span className="truncate text-neutral-100 group-hover:text-blue-300">{e.title}</span>
                    <span className="col-start-2 truncate text-xs text-neutral-500 sm:col-start-auto sm:text-sm">{e.venue}</span>
                    <span className="hidden text-xs text-neutral-500 sm:block">{e.capacity ? `${e.registrationCount}/${e.capacity}` : `${e.registrationCount} in`}</span>
                    <ArrowRight className="hidden size-4 text-neutral-600 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-300 sm:block" />
                  </Link>
                );
              })}
            </div>
            <Link href="/events" className="mt-4 inline-block text-xs text-neutral-500 hover:text-white">
              cd ~/events →
            </Link>
          </div>
        </Window>
      )}

      {past.length > 0 && (
        <Window title="codes@umtc: ~/past — git log --winners">
          <div className="space-y-5 p-4 sm:p-6">
            <p className="text-xs text-neutral-500">
              <span className="text-emerald-300">$</span> git log --winners
            </p>
            {past.slice(0, 4).map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="group block rounded-md px-2 py-1 text-sm hover:bg-white/[0.03]">
                <p>
                  <span className="text-amber-300">● {e.id.slice(0, 7).toLowerCase()}</span>{" "}
                  <span className="text-neutral-100 group-hover:text-blue-300">{e.title}</span>{" "}
                  <span className="text-neutral-500">· {formatDate(e.startDate)}</span>
                </p>
                <p className="mt-1 pl-5 text-xs text-neutral-400">
                  {e.winners.length === 0 ? (
                    <span className="text-neutral-500">{e.prizes.length ? "results pending…" : "no podium (talk/workshop)"}</span>
                  ) : (
                    [...e.winners]
                      .sort((a, b) => a.place - b.place)
                      .map((w) => (
                        <span key={w.place} className="mr-4">
                          <span className={["", "text-amber-300", "text-neutral-300", "text-orange-300"][w.place]}>{["", "1st", "2nd", "3rd"][w.place]}</span> {w.name}
                        </span>
                      ))
                  )}
                </p>
              </Link>
            ))}
            <Link href="/events?view=past" className="inline-block text-xs text-neutral-500 hover:text-white">
              cd ~/past →
            </Link>
          </div>
        </Window>
      )}
    </div>
  );
}

// ===========================================================================
// B · Clean cards
// ===========================================================================
export function DateBlock({ iso, big }: { iso: string; big?: boolean }) {
  return (
    <div className={cn("flex shrink-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] font-chakra", big ? "h-28 w-24" : "h-20 w-16")}>
      <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">{formatDate(iso, { month: "short", day: undefined, year: undefined })}</span>
      <span className={cn("font-bold leading-none text-white", big ? "text-5xl" : "text-3xl")}>{formatDate(iso, { day: "numeric", month: undefined, year: undefined })}</span>
      <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">{formatDate(iso, { weekday: "short", day: undefined, month: undefined, year: undefined })}</span>
    </div>
  );
}

export function SpotsBar({ n, cap }: { n: number; cap: number | null }) {
  if (!cap) return <span className="text-xs text-neutral-500">{n} signed up</span>;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-24 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.min(100, (n / cap) * 100)}%` }} />
      </div>
      <span className="text-xs tabular-nums text-neutral-500">
        {n}/{cap}
      </span>
    </div>
  );
}

export function Heading({ title, href, link }: { title: string; href?: string; link?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-white/10 pb-3">
      <h2 className="font-chakra text-xl font-bold uppercase tracking-wide text-white">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-white">
          {link ?? "View all"} <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

export function SectionsCards({ featured, upcoming, past }: Props) {
  const phase = featured ? getPhase(featured) : null;
  return (
    <div className={cn(wrap, "space-y-16 pt-14")}>
      {featured && phase && (
        <section>
          <Heading title={phase === "ONGOING" ? "Happening now" : "Next up"} />
          <div data-anchor="next-up" className="grid gap-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <DateBlock iso={featured.startDate} big />
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs text-neutral-500">
                <span className={cn("size-1.5 rounded-full", phase === "REGISTRATION_OPEN" ? "bg-emerald-400" : "bg-amber-400")} />
                {PHASE_LABEL[phase]} · {EVENT_TYPE_LABEL[featured.type]}
              </p>
              <h3 className="mt-2 font-chakra text-3xl font-bold uppercase leading-tight text-white sm:text-4xl">{featured.title}</h3>
              {featured.tagline && <p className="mt-2 max-w-xl text-sm text-neutral-400">{featured.tagline}</p>}
              <p className="mt-3 text-sm text-neutral-500">
                {formatTime(featured.startDate)} · {featured.venue}
              </p>
              <div className="mt-4">
                <SpotsBar n={featured.registrationCount} cap={featured.capacity} />
              </div>
            </div>
            <div className="flex flex-col items-start gap-5 lg:items-end">
              <Countdown to={phase === "ONGOING" ? featured.endDate : featured.startDate} />
              <RegisterButton event={featured} label={phase === "REGISTRATION_OPEN" ? "REGISTER" : "VIEW"} />
            </div>
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <Heading title="Coming up" href="/events" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((e) => (
              <EventDateCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <Heading title="Hall of fame" href="/events?view=past" />
          <PodiumRows events={past.slice(0, 5)} />
        </section>
      )}
    </div>
  );
}

/** Upcoming-event card: date block, status, title, time · venue, spots bar. */
export function EventDateCard({ event: e }: { event: CodEvent }) {
  const p = getPhase(e);
  return (
    <Link
      href={`/events/${e.id}`}
      data-anchor={`event-${e.id}`}
      className="group flex gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-white/25 hover:bg-white/[0.04]"
    >
      <DateBlock iso={e.startDate} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-xs text-neutral-500">
          <span className={cn("size-1.5 rounded-full", p === "REGISTRATION_OPEN" ? "bg-emerald-400" : p === "ONGOING" ? "bg-blue-400" : p === "CANCELLED" ? "bg-red-400" : "bg-amber-400")} />
          {PHASE_LABEL[p]} · {EVENT_TYPE_LABEL[e.type]}
        </p>
        <p className="mt-1 truncate font-chakra text-lg font-bold text-white group-hover:text-blue-200">{e.title}</p>
        <p className="truncate text-xs text-neutral-500">
          {formatTime(e.startDate)} · {e.venue}
        </p>
        <div className="mt-3">
          <SpotsBar n={e.registrationCount} cap={e.capacity} />
        </div>
      </div>
    </Link>
  );
}

/** Past events as podium rows: date, title, winners with medal dots. */
export function PodiumRows({ events }: { events: CodEvent[] }) {
  return (
    <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.02]">
      {events.map((e) => (
        <Link key={e.id} href={`/events/${e.id}`} className="group grid gap-2 px-5 py-4 transition-colors hover:bg-white/[0.03] sm:grid-cols-[120px_1fr_2fr] sm:items-center">
          <span className="text-xs text-neutral-500">{formatDate(e.startDate)}</span>
          <span className="font-chakra font-bold text-white group-hover:text-blue-200">{e.title}</span>
          <span className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-400">
            {e.winners.length === 0 ? (
              <span className="text-neutral-600">{e.prizes.length ? "Results coming soon" : EVENT_TYPE_LABEL[e.type]}</span>
            ) : (
              [...e.winners]
                .sort((a, b) => a.place - b.place)
                .map((w) => (
                  <span key={w.place} className="flex items-center gap-1.5">
                    <span className={cn("size-2 rounded-full", ["", "bg-amber-300", "bg-neutral-300", "bg-orange-400"][w.place])} />
                    {w.name}
                  </span>
                ))
            )}
          </span>
        </Link>
      ))}
    </div>
  );
}
