import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import { listPublicEvents } from "@/lib/server/data";
import { EVENT_TYPE_LABEL, formatRange, getPhase } from "@/lib/domain";
import EventCard from "@/components/events/EventCard";
import EventCover from "@/components/events/EventCover";
import PhaseBadge from "@/components/events/PhaseBadge";
import Countdown from "@/components/events/Countdown";
import ScrambleText from "@/components/events/ScrambleText";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { featured, upcoming, past } = await listPublicEvents();
  const phase = featured ? getPhase(featured) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {error === "not-admin" && (
        <p className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          That page is for CODES officers. Ask an owner to add your email if you should have access.
        </p>
      )}
      <section className="pb-12 pt-10 sm:pt-16">
        <p className="eyebrow">CODES · UM Tagum College</p>
        <h1 className="mt-3 max-w-3xl font-chakra text-4xl font-bold uppercase leading-[0.95] sm:text-6xl">
          Build. Learn. <span className="highlight text-white">Compete.</span>
        </h1>
        <p className="mt-6 max-w-xl text-muted-foreground">
          Hackathons, talks and workshops for computing students. Sign up with your school account, get your QR ticket,
          and collect your certificate after.
        </p>
      </section>

      {featured && phase ? (
        <section className="panel grid overflow-hidden md:grid-cols-[1.1fr_1fr]">
          <EventCover event={featured} variant="hero" className="min-h-[220px] md:min-h-[420px]" />
          <div className="flex flex-col gap-5 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <PhaseBadge phase={phase} />
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Featured {EVENT_TYPE_LABEL[featured.type].toLowerCase()}
              </span>
            </div>
            <h2 className="font-chakra text-3xl font-bold uppercase leading-tight sm:text-4xl">
              <ScrambleText text={featured.title} />
            </h2>
            {featured.tagline && <p className="text-muted-foreground">{featured.tagline}</p>}
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <CalendarDays className="size-4" /> {formatRange(featured.startDate, featured.endDate)}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="size-4" /> {featured.venue}
              </p>
              <p className="flex items-center gap-2">
                <Users className="size-4" /> {featured.registrationCount} signed up
                {featured.capacity !== null && ` · ${Math.max(0, featured.capacity - featured.registrationCount)} spots left`}
              </p>
            </div>
            {phase === "ONGOING" ? (
              <Countdown to={featured.endDate} label="Ends in" />
            ) : (
              <Countdown to={featured.startDate} label="Starts in" />
            )}
            <div className="mt-auto flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" className="font-chakra tracking-wide">
                <Link href={`/events/${featured.id}`}>
                  {phase === "REGISTRATION_OPEN" ? "Register now" : "View event"} <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section className="panel grid-bg grid place-items-center px-6 py-20 text-center">
          <p className="eyebrow">Nothing scheduled yet</p>
          <h2 className="mt-3 font-chakra text-2xl font-bold">The next event is in the works.</h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            Check back soon, or browse past events and their winners.
          </p>
          {past.length > 0 && (
            <Button asChild variant="outline" className="mt-6">
              <Link href="/events?view=past">See past events</Link>
            </Button>
          )}
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="mt-16">
          <SectionHeader title="Coming up" href="/events" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.slice(0, 6).map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-16">
          <SectionHeader title="Past events" href="/events?view=past" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {past.slice(0, 3).map((e) => (
              <EventCard key={e.id} event={e} showWinner />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <h2 className="font-chakra text-2xl font-bold uppercase">{title}</h2>
      <Link href={href} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        View all <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
