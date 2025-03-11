import { Trophy } from "lucide-react";
import { CodEvent, PLACE_LABEL, Place } from "@/lib/domain";
import { cn } from "@/lib/utils";

const medal: Record<Place, string> = {
  1: "from-amber-300/30 to-amber-500/5 border-amber-400/40 text-amber-200",
  2: "from-slate-200/25 to-slate-400/5 border-slate-300/30 text-slate-200",
  3: "from-orange-400/25 to-orange-700/5 border-orange-500/30 text-orange-200",
};

/** Prizes, with winners filled in once announced. 1st sits in the middle on wide screens. */
export default function Podium({ event }: { event: CodEvent }) {
  if (event.prizes.length === 0) return null;
  const order: Place[] = [2, 1, 3];
  const prizes = order
    .map((place) => event.prizes.find((p) => p.place === place))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <div className={cn("grid gap-4", prizes.length === 1 ? "sm:grid-cols-1" : prizes.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3", "sm:items-end")}>
      {prizes.map((prize) => {
        const winner = event.winners.find((w) => w.place === prize.place);
        return (
          <div
            key={prize.place}
            className={cn(
              "relative flex flex-col items-center overflow-hidden rounded-xl border bg-gradient-to-b p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
              medal[prize.place],
              prize.place === 1 ? "hud order-first shadow-[0_20px_60px_-20px_rgba(251,191,36,0.45)] sm:order-none sm:pb-10 sm:pt-8" : ""
            )}
          >
            <div className="stripes pointer-events-none absolute inset-0 opacity-40" />
            <div className="pointer-events-none absolute left-1/2 top-1/3 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current opacity-[0.12] blur-3xl" />
            <span className="pointer-events-none absolute right-3 top-2 font-chakra text-5xl font-bold leading-none text-outline">
              {prize.place}
            </span>
            <span className="relative font-chakra text-xs font-bold uppercase tracking-[0.25em]">{PLACE_LABEL[prize.place]}</span>
            {prize.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={prize.imageUrl} alt={prize.title} className="relative my-4 h-24 w-auto object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]" />
            ) : (
              <Trophy className="relative my-6 size-14 opacity-80" />
            )}
            <p className="relative font-chakra text-base font-bold text-foreground">{prize.title}</p>
            {prize.description && <p className="relative mt-1 text-xs text-muted-foreground">{prize.description}</p>}
            {winner && (
              <div className="relative mt-4 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 backdrop-blur">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Winner</p>
                <p className="font-chakra font-bold text-foreground">{winner.name}</p>
                {winner.members && winner.members.length > 0 && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{winner.members.join(", ")}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
