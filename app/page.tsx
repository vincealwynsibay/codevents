import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import { listPublicEvents } from "@/lib/server/data";
import { EVENT_TYPE_LABEL, formatDate, formatRange, getPhase } from "@/lib/domain";
import HeroTerminal, { HeroRow } from "@/components/cli/HeroTerminal";
import EventCard from "@/components/events/EventCard";
import EventCover from "@/components/events/EventCover";
import PhaseBadge from "@/components/events/PhaseBadge";
import Countdown from "@/components/events/Countdown";
import ScrambleText from "@/components/events/ScrambleText";
import SectionHeader from "@/components/site/SectionHeader";
import HeroTicket from "@/components/site/HeroTicket";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { featured, upcoming, past } = await listPublicEvents();
  const phase = featured ? getPhase(featured) : null;

  const all = [...(featured ? [featured] : []), ...upcoming, ...past];
  const stats = [
    { label: "Events hosted", value: all.length },
    { label: "Sign-ups", value: all.reduce((n, e) => n + e.registrationCount, 0) },
    { label: "Podium finishes", value: past.reduce((n, e) => n + e.winners.length, 0) },
    { label: "Coming up", value: upcoming.length + (featured ? 1 : 0) },
  ];
  const TAGS: Record<string, [string, HeroRow["tone"]]> = {
    REGISTRATION_OPEN: ["OPEN", "ok"],
    REGISTRATION_CLOSED: ["CLOSED", "warn"],
    ONGOING: ["LIVE", "accent"],
  };
  const heroRows: HeroRow[] = [...(featured ? [featured] : []), ...upcoming].map((e) => {
    const [tag, tone] = TAGS[getPhase(e)] ?? ["SOON", "dim"];
    return {
      id: e.id,
      tag,
      tone,
      date: formatDate(e.startDate, { year: undefined }),
      title: e.title,
      spots: e.capacity !== null ? `${e.registrationCount}/${e.capacity}` : `${e.registrationCount} in`,
    };
  });
  const tickerItems = all.length
    ? all.map((e) => `${EVENT_TYPE_LABEL[e.type]} · ${e.title}`)
    : ["Hackathons", "Workshops", "Talks", "Code nights"];

  return (
    <div className="relative">
      {/* hero backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
        <div className="absolute left-1/2 top-24 size-[520px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {error === "not-admin" && (
          <p className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
            That page is for CODES officers. Ask an owner to add your email if you should have access.
          </p>
        )}

        <section className="relative pb-10 pt-12 sm:pt-20">
          <div className="absolute right-6 top-14 hidden lg:block xl:right-10">
            <HeroTicket event={featured} />
          </div>
          <h1 data-anchor="hero-title" className=" max-w-4xl font-chakra text-5xl font-bold uppercase leading-[0.92] tracking-tight sm:text-7xl">
            <span className="text-gradient">Build. Learn.</span>
            <br />
            <span className="highlight text-white">Compete.</span>
          </h1>
          <div className="mt-8">
            <HeroTerminal rows={heroRows} />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="font-chakra tracking-wide">
              <Link href={featured ? `/events/${featured.id}` : "/events"}>
                {phase === "REGISTRATION_OPEN" ? "Register for the next event" : "Browse events"} <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-chakra tracking-wide">
              <Link href="/events?view=past">Past winners</Link>
            </Button>
          </div>

          <dl className="relative z-10 mt-12 grid grid-cols-2 overflow-hidden rounded-xl border border-white/[0.08] bg-black/30 backdrop-blur sm:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`relative px-5 py-4 ${i > 0 ? "sm:border-l" : ""} ${i % 2 === 1 ? "border-l sm:border-l" : ""} ${i > 1 ? "border-t sm:border-t-0" : ""} border-white/[0.08]`}
              >
                <dt className="font-chakra text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{s.label}</dt>
                <dd className="mt-1 font-chakra text-3xl font-bold tabular-nums">{String(s.value).padStart(2, "0")}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {/* ticker */}
      <div className="marquee relative overflow-hidden border-y border-white/[0.06] bg-white/[0.02] py-3">
        <div className="stripes pointer-events-none absolute inset-0 opacity-40" />
        <div className="marquee-track relative flex w-max gap-10 font-chakra text-sm uppercase tracking-[0.2em] text-muted-foreground">
          {[...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems].map((t, i) => (
            <span key={i} className="flex items-center gap-10 whitespace-nowrap">
              {t}
              <span className="text-blue-400">✦</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <SectionHeader index="01" title={phase === "ONGOING" ? "Happening now" : "Next up"} />
        {featured && phase ? (
          <section className="panel hud grid overflow-hidden md:grid-cols-[1.1fr_1fr]">
            <EventCover event={featured} variant="hero" className="min-h-[220px] md:min-h-[440px]" />
            <div className="relative flex flex-col gap-5 p-6 sm:p-8">
              <div className="dot-bg pointer-events-none absolute inset-0 opacity-[0.15] [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />
              <div className="relative flex flex-wrap items-center gap-2">
                <PhaseBadge phase={phase} />
                <span className="font-chakra text-[11px] uppercase tracking-widest text-muted-foreground">
                  Featured {EVENT_TYPE_LABEL[featured.type].toLowerCase()}
                </span>
              </div>
              <h2 className="relative font-chakra text-3xl font-bold uppercase leading-tight sm:text-4xl">
                <ScrambleText text={featured.title} />
              </h2>
              {featured.tagline && <p className="relative text-muted-foreground">{featured.tagline}</p>}
              <div className="relative grid gap-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-blue-300" /> {formatRange(featured.startDate, featured.endDate)}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="size-4 text-blue-300" /> {featured.venue}
                </p>
                <p className="flex items-center gap-2">
                  <Users className="size-4 text-blue-300" /> {featured.registrationCount} signed up
                  {featured.capacity !== null &&
                    ` · ${Math.max(0, featured.capacity - featured.registrationCount)} spots left`}
                </p>
              </div>
              {featured.capacity !== null && (
                <div className="relative">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#2a4aff] to-[#a78bfa] shadow-[0_0_12px_rgba(42,74,255,0.8)]"
                      style={{ width: `${Math.min(100, (featured.registrationCount / featured.capacity) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="relative">
                {phase === "ONGOING" ? (
                  <Countdown to={featured.endDate} label="Ends in" />
                ) : (
                  <Countdown to={featured.startDate} label="Starts in" />
                )}
              </div>
              <div className="relative mt-auto flex flex-wrap gap-3 pt-2">
                <Button asChild size="lg" className="font-chakra tracking-wide">
                  <Link href={`/events/${featured.id}`}>
                    {phase === "REGISTRATION_OPEN" ? "Register now" : "View event"} <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <section className="panel hud relative grid place-items-center overflow-hidden px-6 py-20 text-center">
            <div className="grid-bg absolute inset-0 opacity-60" />
            <div className="relative">
              <p className="eyebrow">Nothing scheduled yet</p>
              <h2 className="mt-3 font-chakra text-2xl font-bold">The next event is in the works.</h2>
              <p className="mt-2 max-w-md text-muted-foreground">Check back soon, or browse past events and their winners.</p>
              {past.length > 0 && (
                <Button asChild variant="outline" className="mt-6">
                  <Link href="/events?view=past">See past events</Link>
                </Button>
              )}
            </div>
          </section>
        )}

        {upcoming.length > 0 && (
          <section className="mt-20">
            <SectionHeader index="02" title="Coming up" href="/events" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.slice(0, 6).map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section className="mt-20">
            <SectionHeader index={upcoming.length > 0 ? "03" : "02"} title="Hall of fame" href="/events?view=past" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {past.slice(0, 3).map((e) => (
                <EventCard key={e.id} event={e} showWinner />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
