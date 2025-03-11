import { PHASE_LABEL, Phase } from "@/lib/domain";
import { cn } from "@/lib/utils";

const styles: Record<Phase, string> = {
  DRAFT: "border-white/15 bg-white/5 text-neutral-300",
  CANCELLED: "border-red-500/30 bg-red-500/10 text-red-300",
  REGISTRATION_OPEN: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  REGISTRATION_CLOSED: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  ONGOING: "border-primary/50 bg-primary/15 text-blue-200",
  AWAITING_RESULTS: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  COMPLETED: "border-white/15 bg-white/5 text-neutral-300",
};

export default function PhaseBadge({ phase, className }: { phase: Phase; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-chakra text-[11px] font-semibold uppercase tracking-wider",
        styles[phase],
        className
      )}
    >
      {(phase === "ONGOING" || phase === "REGISTRATION_OPEN") && (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      )}
      {PHASE_LABEL[phase]}
    </span>
  );
}
