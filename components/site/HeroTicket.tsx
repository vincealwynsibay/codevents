import Image from "next/image";
import { CodEvent, EVENT_TYPE_LABEL, formatDate, formatTime } from "@/lib/domain";

// Deterministic pseudo-QR pattern so server and client render the same thing.
function pattern(seed: string, size = 11) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const cells: boolean[] = [];
  for (let i = 0; i < size * size; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    cells.push((h & 3) !== 0);
  }
  return cells;
}

/** Decorative ticket for the hero. Purely visual; hidden from assistive tech. */
export default function HeroTicket({ event }: { event: CodEvent | null }) {
  const title = event?.title ?? "Your next event";
  const cells = pattern(event?.id ?? "codevents");
  return (
    <div aria-hidden className="pointer-events-none relative select-none">
      {/* back card */}
      <div className="absolute inset-0 translate-x-6 translate-y-6 rotate-[8deg] rounded-2xl border border-white/10 bg-gradient-to-br from-[#7c3aed]/40 to-[#1d34b3]/30 blur-[1px]" />
      {/* front ticket */}
      <div className="relative w-[340px] rotate-[-5deg] overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-[#16195a] via-[#0d1033] to-[#07081a] shadow-[0_40px_80px_-30px_rgba(42,74,255,0.8),inset_0_1px_0_rgba(255,255,255,0.12)]">
        <div className="grid-bg absolute inset-0 opacity-50" />
        <div className="scanlines absolute inset-0 opacity-50" />
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-[#2a4aff]/40 blur-3xl" />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/images/codes.png" alt="" width={18} height={18} />
              <span className="font-chakra text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70">Admit one</span>
            </div>
            <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 font-chakra text-[9px] uppercase tracking-widest text-emerald-300">
              Confirmed
            </span>
          </div>
          <p className="mt-6 font-chakra text-[10px] uppercase tracking-[0.3em] text-blue-300/80">
            {event ? EVENT_TYPE_LABEL[event.type] : "CODES"}
          </p>
          <p className="mt-1 line-clamp-2 font-chakra text-2xl font-bold uppercase leading-tight text-white">{title}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 font-chakra text-[10px] uppercase tracking-[0.2em] text-white/50">
            <div>
              <p>Date</p>
              <p className="mt-0.5 text-sm normal-case tracking-normal text-white/90">
                {event ? formatDate(event.startDate) : "TBA"}
              </p>
            </div>
            <div>
              <p>Time</p>
              <p className="mt-0.5 text-sm normal-case tracking-normal text-white/90">
                {event ? formatTime(event.startDate) : "TBA"}
              </p>
            </div>
          </div>
        </div>

        {/* perforation */}
        <div className="relative flex items-center">
          <span className="-ml-3 size-6 rounded-full bg-background" />
          <span className="h-px flex-1 border-t border-dashed border-white/20" />
          <span className="-mr-3 size-6 rounded-full bg-background" />
        </div>

        <div className="relative flex items-center justify-between gap-4 p-6 pt-4">
          <div className="font-chakra text-[10px] uppercase leading-relaxed tracking-[0.2em] text-white/50">
            <p>Holder</p>
            <p className="text-sm normal-case tracking-normal text-white/90">You</p>
            <p className="mt-2">Seat</p>
            <p className="text-sm normal-case tracking-normal text-white/90">Free · Any</p>
          </div>
          <div className="grid size-[88px] grid-cols-11 gap-px rounded-md bg-white p-1.5">
            {cells.map((on, i) => (
              <span key={i} className={on ? "bg-[#0a0a0a]" : "bg-white"} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
