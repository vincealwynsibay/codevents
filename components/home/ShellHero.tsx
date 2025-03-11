/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Press_Start_2P } from "next/font/google";
import { CodEvent, formatDate, formatTime } from "@/lib/domain";
import HeroTerminal, { HeroRow } from "@/components/cli/HeroTerminal";
import OpenShellButton from "@/components/home/OpenShellButton";

const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], display: "swap" });
const px = "[image-rendering:pixelated]";

/**
 * Home hero: the shell (direction A) dressed in the arcade look.
 * Decorative only: starfield, pixel title, power-ups, a ground line with bugs.
 */
export default function ShellHero({
  featured,
  open,
  rows,
  counts,
}: {
  featured: CodEvent | null;
  open: boolean;
  rows: HeroRow[];
  counts: { contests: number; workshops: number; talks: number; trophies: number };
}) {
  const powerups = [
    { icon: "/images/sprites/icon-laptop.png", label: "CONTESTS", n: counts.contests },
    { icon: "/images/sprites/icon-tools.png", label: "WORKSHOPS", n: counts.workshops },
    { icon: "/images/sprites/icon-mic.png", label: "TALKS", n: counts.talks },
    { icon: "/images/sprites/icon-trophy.png", label: "TROPHIES", n: counts.trophies },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* starfield */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black_60%,transparent)]"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20px 30px,#fff,transparent),radial-gradient(1px 1px at 140px 90px,#9fb0ff,transparent),radial-gradient(2px 2px at 220px 160px,#fff,transparent),radial-gradient(1px 1px at 320px 40px,#fff,transparent),radial-gradient(1px 1px at 60px 200px,#9fb0ff,transparent)",
          backgroundSize: "360px 240px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-0 pt-12 sm:px-6 sm:pt-16">
        <p className={`${pixel.className} text-center text-[9px] tracking-[0.3em] text-amber-300 sm:text-[10px]`}>
          HI-SCORE · CODES · UM TAGUM
        </p>

        {/* the shell */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/70 font-mono shadow-[0_40px_100px_-30px_rgba(42,74,255,0.75)] backdrop-blur">
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="size-3 rounded-full bg-red-500/80" />
            <span className="size-3 rounded-full bg-amber-400/80" />
            <span className="size-3 rounded-full bg-emerald-400/80" />
            <span className="ml-3 flex-1 truncate text-xs text-neutral-500">codes@umtc: ~ — codevents</span>
            <span className={`${pixel.className} hidden text-[8px] text-neutral-500 sm:block`}>1UP</span>
          </div>

          <div className="scanlines grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.15fr_1fr]">
            <div className="flex flex-col">
              <h1
                className={`${pixel.className} text-[28px] leading-tight text-white [text-shadow:3px_3px_0_#2a4aff,6px_6px_0_#152580] sm:text-5xl`}
              >
                CODEVENTS
              </h1>
              <p className="mt-6 text-sm leading-relaxed text-neutral-300">
                <span className="text-emerald-300">$</span> hackathons, talks &amp; workshops by the Computer Debugger&apos;s
                Society.
                <br />
                <span className="text-emerald-300">$</span> sign up, show your QR at the door, collect your certificate.
              </p>

              {featured && (
                <p className={`${pixel.className} mt-6 text-[9px] leading-loose text-neutral-400 sm:text-[10px]`}>
                  NEXT LEVEL: <span className="text-blue-300">{featured.title.toUpperCase()}</span>
                  <br />
                  {formatDate(featured.startDate, { year: undefined }).toUpperCase()} · {formatTime(featured.startDate)} ·{" "}
                  {featured.venue.toUpperCase()}
                </p>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-4 lg:mt-auto lg:pt-8">
                <Link
                  href={featured ? `/events/${featured.id}` : "/events"}
                  className={`${pixel.className} group rounded-md border-2 border-amber-300/70 bg-amber-300/10 px-4 py-3 text-[11px] text-amber-200 transition-colors hover:bg-amber-300/20 sm:text-xs`}
                >
                  <span className="blink">▶</span> {open ? "PRESS START" : "VIEW EVENTS"}
                </Link>
                <OpenShellButton />
                <Link href="/events?view=past" className="text-xs text-neutral-400 underline-offset-4 hover:text-white hover:underline">
                  cd ~/past
                </Link>
              </div>
            </div>

            <div>
              <HeroTerminal rows={rows} />
            </div>
          </div>

          {/* power-ups */}
          <div className={`${pixel.className} grid grid-cols-2 border-t border-white/10 sm:grid-cols-4`}>
            {powerups.map((p, i) => (
              <div
                key={p.label}
                className={`flex items-center gap-3 px-5 py-4 ${i % 2 === 1 ? "border-l border-white/10" : ""} ${i > 1 ? "border-t border-white/10 sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`}
              >
                <img src={p.icon} alt="" className={`h-8 w-auto ${px}`} />
                <div>
                  <p className="text-[8px] text-neutral-500">{p.label}</p>
                  <p className="mt-1 text-sm text-white">×{String(p.n).padStart(2, "0")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ground line with bugs crawling past (decorative) */}
        <div aria-hidden className="relative mt-10 h-14">
          <span className="bug-sprite bug-walk absolute bottom-6 block size-7" />
          <span className="bug-sprite bug-walk absolute bottom-6 block size-6 [animation-delay:-9s,0s]" />
          <span className="bug-sprite bug-walk-rev absolute bottom-6 block size-7 [animation-delay:-4s,0s]" />
          <div className="absolute inset-x-0 bottom-0 h-6 border-t-4 border-[#5DA144] bg-[repeating-linear-gradient(90deg,#3f2a1a_0_16px,#4a3220_16px_32px)] [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]" />
        </div>
      </div>
    </section>
  );
}
