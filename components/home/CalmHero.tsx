import Link from "next/link";
import { Press_Start_2P } from "next/font/google";
import { CodEvent } from "@/lib/domain";
import HeroTerminal, { HeroRow } from "@/components/cli/HeroTerminal";
import OpenShellButton from "@/components/home/OpenShellButton";
import { cn } from "@/lib/utils";

const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], display: "swap" });

/**
 * The calmer take: one shell window, a big title, one call to action.
 * The only pixel-style element left is the PRESS START button. `build` in the shell turns the page into a sandbox.
 */
export default function CalmHero({
  featured,
  open,
  rows,
  wide = false,
}: {
  featured: CodEvent | null;
  open: boolean;
  rows: HeroRow[];
  /** Wider, taller variant: nearly full-bleed with a bigger terminal. */
  wide?: boolean;
}) {
  return (
    <section className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,black_50%,transparent)]"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20px 30px,#fff,transparent),radial-gradient(1px 1px at 160px 110px,#9fb0ff,transparent),radial-gradient(1px 1px at 300px 60px,#fff,transparent)",
          backgroundSize: "360px 220px",
        }}
      />

      <div className={cn("relative mx-auto px-4 pb-10 pt-14 sm:px-6 sm:pt-20", wide ? "max-w-[92rem] lg:px-10" : "max-w-6xl")}>
        <div data-solid className="overflow-hidden rounded-2xl border border-white/10 bg-black/60 font-mono shadow-[0_30px_80px_-30px_rgba(42,74,255,0.6)] backdrop-blur">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <span className="size-3 rounded-full bg-white/15" />
            <span className="size-3 rounded-full bg-white/15" />
            <span className="size-3 rounded-full bg-white/15" />
            <span className="ml-3 text-xs text-neutral-500">codes@umtc: ~</span>
          </div>

          <div className={cn("grid items-center gap-10 p-6 sm:p-10", wide ? "min-h-[460px] lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:p-16" : "lg:grid-cols-[1fr_1fr]")}>
            <div>
              <h1 className={cn("font-chakra font-bold uppercase leading-none tracking-tight text-white [text-shadow:3px_3px_0_#2a4aff]", wide ? "text-6xl sm:text-8xl" : "text-5xl sm:text-7xl")}>
                CODEVENTS
              </h1>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-neutral-400">
                Hackathons, talks and workshops by CODES, UM Tagum&apos;s computing society. Sign up, show your QR at the door,
                get your certificate.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={featured ? `/events/${featured.id}` : "/events"}
                  className={`${pixel.className} rounded-md bg-amber-300 px-4 py-3 text-[11px] text-black shadow-[0_4px_0_0_#b45309] transition-transform hover:-translate-y-px active:translate-y-0.5 active:shadow-none`}
                >
                  ▶ {open ? "PRESS START" : "SEE EVENTS"}
                </Link>
                <OpenShellButton />
                <span className="text-xs text-neutral-500">
                  try <span className="text-neutral-300">build</span> in the shell
                </span>
              </div>
            </div>
            <HeroTerminal rows={rows} className={wide ? "max-w-none text-[13.5px]" : undefined} maxRows={wide ? 6 : 4} />
          </div>
        </div>

      </div>
    </section>
  );
}
