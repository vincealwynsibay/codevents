/* eslint-disable @next/next/no-img-element */
// Three hero directions (huashu-style: different structures, not reskins),
// built with the generated pixel assets and the real event data.
import Link from "next/link";
import { CodEvent, EVENT_TYPE_LABEL, formatDate, formatRange, formatTime, getPhase } from "@/lib/domain";
import HeroTerminal, { HeroRow } from "@/components/cli/HeroTerminal";

export type HeroData = {
  featured: CodEvent | null;
  upcoming: CodEvent[];
  rows: HeroRow[];
  counts: { contests: number; talks: number; workshops: number; past: number };
};

const ICON: Record<string, string> = {
  CONTEST: "/images/sprites/icon-laptop.png",
  TALK: "/images/sprites/icon-mic.png",
  WORKSHOP: "/images/sprites/icon-tools.png",
  OTHER: "/images/sprites/icon-trophy.png",
};

const px = "[image-rendering:pixelated]";

// ---------------------------------------------------------------------------
// A · SHELL — the hero *is* a terminal window; Debuggy sits on its title bar.
// ---------------------------------------------------------------------------
export function HeroShell({ data }: { data: HeroData }) {
  const f = data.featured;
  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 pt-16 sm:px-6">
      <div className="relative">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/70 font-mono shadow-[0_40px_100px_-30px_rgba(42,74,255,0.75)] backdrop-blur">
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="size-3 rounded-full bg-red-500/80" />
            <span className="size-3 rounded-full bg-amber-400/80" />
            <span className="size-3 rounded-full bg-emerald-400/80" />
            <span className="ml-3 text-xs text-neutral-500">codes@umtc: ~ — codevents</span>
          </div>
          <div className="scanlines grid gap-8 p-6 sm:p-10 md:grid-cols-[1.2fr_1fr]">
            <div>
              <pre className="text-[9px] leading-[1.15] text-blue-300 sm:text-[11px]">{String.raw`  ____ ___  ____  _____     _______ _   _ _____ ____
 / ___/ _ \|  _ \| ____\ \   / / ____| \ | |_   _/ ___|
| |  | | | | | | |  _|  \ \ / /|  _| |  \| | | | \___ \
| |__| |_| | |_| | |___  \ V / | |___| |\  | | |  ___) |
 \____\___/|____/|_____|  \_/  |_____|_| \_| |_| |____/`}</pre>
              <p className="mt-6 text-sm text-neutral-300">
                <span className="text-emerald-300">$</span> hackathons, talks &amp; workshops by the Computer Debugger&apos;s Society.
                <br />
                <span className="text-emerald-300">$</span> sign up, get a QR ticket, collect your certificate.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                <Link href={f ? `/events/${f.id}` : "/events"} className="rounded-md bg-blue-500 px-4 py-2 font-bold text-white shadow-[0_4px_0_0_#1d4ed8] hover:-translate-y-px">
                  ./register {f ? `--event "${f.title}"` : ""}
                </Link>
                <Link href="/terminal" className="rounded-md border border-white/15 px-4 py-2 text-neutral-300 hover:border-blue-400/60 hover:text-white">
                  open shell <kbd className="ml-1 rounded border border-white/15 px-1 text-[11px]">`</kbd>
                </Link>
              </div>
            </div>
            <div>
              <HeroTerminal rows={data.rows} />
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-neutral-400">
                {(["CONTEST", "WORKSHOP", "TALK"] as const).map((t) => (
                  <span key={t} className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
                    <img src={ICON[t]} alt="" className={`h-5 w-auto ${px}`} /> {EVENT_TYPE_LABEL[t].toLowerCase()}s
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// B · ARCADE — a game title screen: PRESS START, power-ups, a ground line.
// ---------------------------------------------------------------------------
export function HeroArcade({ data, pixelFont }: { data: HeroData; pixelFont: string }) {
  const f = data.featured;
  const powerups = [
    { icon: ICON.CONTEST, label: "CONTESTS", n: data.counts.contests },
    { icon: ICON.WORKSHOP, label: "WORKSHOPS", n: data.counts.workshops },
    { icon: ICON.TALK, label: "TALKS", n: data.counts.talks },
    { icon: "/images/sprites/icon-trophy.png", label: "TROPHIES", n: data.counts.past },
  ];
  return (
    <section className={`relative overflow-hidden ${pixelFont}`}>
      {/* starfield */}
      <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(1px_1px_at_20px_30px,#fff,transparent),radial-gradient(1px_1px_at_120px_80px,#9fb0ff,transparent),radial-gradient(2px_2px_at_200px_150px,#fff,transparent),radial-gradient(1px_1px_at_300px_40px,#fff,transparent)] [background-size:340px_200px] opacity-50" />
      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pb-0 pt-16 text-center sm:px-6">
        <p className="text-[10px] tracking-[0.3em] text-amber-300">HI-SCORE · CODES UMTC</p>
        <h1 className="mt-6 text-3xl leading-tight text-white [text-shadow:4px_4px_0_#2a4aff,8px_8px_0_#152580] sm:text-6xl">
          CODEVENTS
        </h1>
        <p className="mt-6 text-[10px] leading-relaxed text-neutral-300 sm:text-xs">
          {f ? (
            <>
              NEXT LEVEL: <span className="text-blue-300">{f.title.toUpperCase()}</span>
              <br />
              {formatDate(f.startDate, { year: undefined }).toUpperCase()} · {formatTime(f.startDate)} · {f.venue.toUpperCase()}
            </>
          ) : (
            "NO LEVELS LOADED. CHECK BACK SOON."
          )}
        </p>
        <Link
          href={f ? `/events/${f.id}` : "/events"}
          className="blink mt-10 text-sm text-amber-300 hover:text-white sm:text-base"
        >
          ▶ PRESS START
        </Link>
        <p className="mt-3 text-[9px] text-neutral-500">INSERT SCHOOL ACCOUNT TO CONTINUE</p>

        <div className="mt-12 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {powerups.map((p) => (
            <div key={p.label} className="rounded-md border-2 border-white/15 bg-black/50 p-3 shadow-[inset_0_0_0_2px_rgba(0,0,0,0.6)]">
              <img src={p.icon} alt="" className={`mx-auto h-10 w-auto ${px}`} />
              <p className="mt-2 text-[9px] text-neutral-400">{p.label}</p>
              <p className="mt-1 text-lg text-white">×{String(p.n).padStart(2, "0")}</p>
            </div>
          ))}
        </div>

        {/* stage */}
        <div className="relative mt-14 h-40 w-full">
          <span className="bug-sprite absolute bottom-6 right-[30%] block size-10 rotate-90" />
          <span className="bug-sprite absolute bottom-6 right-[18%] block size-8 rotate-90 [animation-delay:-0.2s]" />
          <span className="absolute bottom-[110px] left-[12%] rounded-sm border-2 border-white bg-black px-2 py-1 text-[9px] text-white">
            BUGS AHEAD!
          </span>
          <div className="absolute inset-x-0 bottom-0 h-6 border-t-4 border-[#5DA144] bg-[repeating-linear-gradient(90deg,#3f2a1a_0_16px,#4a3220_16px_32px)]" />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// C · IDE — an editor: file tree, the next event as code, Debuggy as a linter.
// ---------------------------------------------------------------------------
export function HeroIde({ data }: { data: HeroData }) {
  const f = data.featured;
  const phase = f ? getPhase(f) : null;
  const k = "text-violet-300";
  const s = "text-emerald-300";
  const n = "text-amber-300";
  const c = "text-neutral-500";
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-chakra text-4xl font-bold uppercase leading-[0.95] sm:text-6xl">
          Ship something <span className="highlight text-white">this sem.</span>
        </h1>
        <p className="mt-4 text-muted-foreground">Hackathons, talks and workshops by CODES. Your next commit starts at an event.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d0f17] font-mono text-[13px] shadow-[0_40px_100px_-30px_rgba(42,74,255,0.6)]">
        {/* title + tabs */}
        <div className="flex items-center border-b border-white/10 bg-[#090a10] text-xs">
          <div className="flex gap-1.5 px-4">
            <span className="size-2.5 rounded-full bg-red-500/70" />
            <span className="size-2.5 rounded-full bg-amber-400/70" />
            <span className="size-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="border-x border-t-2 border-x-white/10 border-t-blue-400 bg-[#0d0f17] px-4 py-2 text-neutral-200">next-event.ts</span>
          <span className="px-4 py-2 text-neutral-500">upcoming.json</span>
          <span className="hidden px-4 py-2 text-neutral-500 sm:block">README.md</span>
        </div>
        <div className="grid md:grid-cols-[200px_1fr]">
          {/* tree */}
          <aside className="hidden border-r border-white/10 bg-[#0a0b12] p-3 text-xs text-neutral-400 md:block">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-neutral-600">Explorer</p>
            <p>▾ codevents</p>
            <p className="pl-3">▾ events</p>
            {[...(f ? [f] : []), ...data.upcoming].slice(0, 5).map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="flex items-center gap-1.5 truncate pl-6 hover:text-white">
                <img src={ICON[e.type]} alt="" className={`h-3 w-auto ${px}`} />
                {e.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 18)}.ts
              </Link>
            ))}
            <p className="pl-3">▸ past</p>
            <p className="pl-3">▸ me</p>
            <p className="pl-3 text-blue-300">README.md</p>
          </aside>
          {/* editor */}
          <div className="relative overflow-x-auto p-5">
            {f ? (
              <pre className="leading-7">
                <span className={c}>{"// the next CODES event · edit me by showing up"}</span>
                {"\n"}
                <span className={k}>export const</span> nextEvent = {"{"}
                {"\n"}  title: <span className={s}>&quot;{f.title}&quot;</span>,
                {"\n"}  type: <span className={s}>&quot;{EVENT_TYPE_LABEL[f.type].toLowerCase()}&quot;</span>,
                {"\n"}  when: <span className={s}>&quot;{formatRange(f.startDate, f.endDate)}&quot;</span>,
                {"\n"}  where: <span className={s}>&quot;{f.venue}&quot;</span>,
                {"\n"}  spots: <span className={n}>{f.capacity ?? "Infinity"}</span>,
                {"\n"}  signedUp: <span className={n}>{f.registrationCount}</span>,
                {"\n"}  open: <span className={n}>{String(phase === "REGISTRATION_OPEN")}</span>,
                {"\n"}{"}"};{"\n\n"}
                <span className={k}>await</span> register(nextEvent); <span className={c}>{"// ← you are here"}</span>
              </pre>
            ) : (
              <pre className={c}>{"// no events scheduled. check back soon."}</pre>
            )}
            <div className="mt-6 flex flex-wrap gap-3 font-sans text-sm">
              <Link href={f ? `/events/${f.id}` : "/events"} className="rounded-md bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-400">
                Run ▶ register()
              </Link>
              <Link href="/events" className="rounded-md border border-white/15 px-4 py-2 text-neutral-300 hover:text-white">
                Open folder: events/
              </Link>
            </div>
            {/* linter */}
            <div className="mt-8 flex items-end gap-3 md:absolute md:bottom-4 md:right-4 md:mt-0">
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 font-sans text-xs text-emerald-200">
                <b>linter:</b> 0 bugs found. {f && phase === "REGISTRATION_OPEN" ? "Registration is open. Ship it? 🚀" : "Looking good."}
              </div>
            </div>
          </div>
        </div>
        {/* status bar */}
        <div className="flex items-center justify-between bg-blue-600 px-3 py-1 text-[11px] text-white">
          <span>⎇ main · ✓ 0 problems</span>
          <span>
            {data.upcoming.length + (f ? 1 : 0)} upcoming · {data.counts.past} shipped · UTF-8 · TS
          </span>
        </div>
      </div>
    </section>
  );
}
