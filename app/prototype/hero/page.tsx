import Link from "next/link";
import { Press_Start_2P } from "next/font/google";
import { listPublicEvents } from "@/lib/server/data";
import { formatDate, getPhase } from "@/lib/domain";
import { HeroArcade, HeroData, HeroIde, HeroShell } from "@/components/prototype/HeroDirections";
import type { HeroRow } from "@/components/cli/HeroTerminal";
import HeroPlay, { Door } from "@/components/prototype/HeroPlay";
import ShellHero from "@/components/home/ShellHero";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prototype · hero directions", robots: { index: false } };

const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"] });

const DIRECTIONS = [
  { key: "shell-arcade", label: "A · Shell × arcade", note: "The shell is the hero, dressed in the arcade look. Decorative, not playable. No mascot." },
  { key: "play", label: "A+B · Play", note: "One window: shell on top, a walkable world below. Doors are folders. ← → space ↑" },
  { key: "shell", label: "A · Shell", note: "The hero is the terminal. Debuggy perches on it." },
  { key: "arcade", label: "B · Arcade", note: "A game title screen: PRESS START, power-ups, bugs on the ground." },
  { key: "ide", label: "C · IDE", note: "An editor: file tree, the next event as code, Debuggy as the linter." },
] as const;

export default async function HeroDirectionsPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await searchParams;
  const dir = DIRECTIONS.find((x) => x.key === d)?.key ?? "shell-arcade";
  const { featured, upcoming, past } = await listPublicEvents();
  const all = [...(featured ? [featured] : []), ...upcoming];
  const TAGS: Record<string, [string, HeroRow["tone"]]> = {
    REGISTRATION_OPEN: ["OPEN", "ok"],
    REGISTRATION_CLOSED: ["CLOSED", "warn"],
    ONGOING: ["LIVE", "accent"],
  };
  const data: HeroData = {
    featured,
    upcoming,
    rows: all.map((e) => {
      const [tag, tone] = TAGS[getPhase(e)] ?? ["SOON", "dim"];
      return { id: e.id, tag, tone, date: formatDate(e.startDate, { year: undefined }), title: e.title, spots: e.capacity !== null ? `${e.registrationCount}/${e.capacity}` : `${e.registrationCount} in` };
    }),
    counts: {
      contests: all.filter((e) => e.type === "CONTEST").length,
      talks: all.filter((e) => e.type === "TALK").length,
      workshops: all.filter((e) => e.type === "WORKSHOP").length,
      past: past.reduce((n, e) => n + e.winners.length, 0),
    },
  };
  const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const ICONS: Record<string, string> = {
    CONTEST: "/images/sprites/icon-laptop.png",
    TALK: "/images/sprites/icon-mic.png",
    WORKSHOP: "/images/sprites/icon-tools.png",
    OTHER: "/images/sprites/icon-trophy.png",
  };
  const doors: Door[] = [
    ...all.slice(0, 3).map((e) => ({
      path: `events/${slug(e.title)}`,
      label: e.title.length > 18 ? e.title.slice(0, 17).toUpperCase() + "…" : e.title.toUpperCase(),
      href: `/events/${e.id}`,
      icon: ICONS[e.type],
      tone: "event" as const,
    })),
    { path: "past", label: "HALL OF FAME", href: "/events?view=past", icon: "/images/sprites/icon-trophy.png", tone: "past" },
    { path: "me", label: "MY TICKETS", href: "/me", icon: "/images/sprites/icon-trophy.png", tone: "me" },
    { path: "bin/sh", label: "TERMINAL", href: null, icon: "/images/sprites/icon-laptop.png", tone: "shell" },
  ];
  const current = DIRECTIONS.find((x) => x.key === dir)!;

  return (
    <div className="pb-28">
      {dir === "shell-arcade" && (
        <ShellHero
          featured={featured}
          open={!!featured && getPhase(featured) === "REGISTRATION_OPEN"}
          rows={data.rows}
          counts={{ contests: data.counts.contests, workshops: data.counts.workshops, talks: data.counts.talks, trophies: data.counts.past }}
        />
      )}
      {dir === "play" && <HeroPlay doors={doors} pixelFont={pixel.className} />}
      {dir === "shell" && <HeroShell data={data} />}
      {dir === "arcade" && <HeroArcade data={data} pixelFont={pixel.className} />}
      {dir === "ide" && <HeroIde data={data} />}

      <div className="no-print fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        <p className="rounded-full bg-black/80 px-3 py-1 font-mono text-[11px] text-neutral-400 backdrop-blur">{current.note}</p>
        <nav className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-white/10 bg-black/85 p-1 shadow-2xl backdrop-blur">
          {DIRECTIONS.map((x) => (
            <Link
              key={x.key}
              href={`/prototype/hero?d=${x.key}`}
              scroll={false}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 font-chakra text-xs transition-colors",
                dir === x.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {x.label}
            </Link>
          ))}
          <Link href="/prototype/assets" className="whitespace-nowrap rounded-full px-3 py-1.5 font-chakra text-xs text-muted-foreground hover:text-foreground">
            assets ↗
          </Link>
        </nav>
      </div>
    </div>
  );
}
