import Link from "next/link";

export default function Footer() {
  return (
    <footer data-anchor="footer" className="no-print relative mt-28 overflow-hidden border-t border-white/[0.06]">
      <div className="glow-line absolute inset-x-0 top-0 opacity-40" />
      <div className="grid-fade pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <p className="font-chakra text-sm font-bold tracking-wider">
              CODE<span className="text-blue-300">VENTS</span>
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Hackathons, talks and workshops by CODES, the computing society of UM Tagum College.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 font-chakra text-sm text-muted-foreground">
            <Link href="/events" className="hover:text-foreground">
              Events
            </Link>
            <Link href="/events?view=past" className="hover:text-foreground">
              Past winners
            </Link>
            <Link href="/me" className="hover:text-foreground">
              My events
            </Link>
          </nav>
        </div>
        <div className="mt-8 flex items-center justify-between border-t border-dashed border-white/10 py-4 font-chakra text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>© CODES · UM Tagum</span>
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" /> All systems go
          </span>
        </div>
      </div>
      <p
        aria-hidden
        className="text-outline pointer-events-none relative -mb-[0.22em] select-none text-center font-chakra text-[18vw] font-bold leading-none tracking-tight sm:text-[16vw] lg:text-[13rem]"
      >
        CODEVENTS
      </p>
    </footer>
  );
}
