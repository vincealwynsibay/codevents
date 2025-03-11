import Image from "next/image";
import { CodEvent, EVENT_TYPE_LABEL } from "@/lib/domain";
import { cn } from "@/lib/utils";

const gradients: Record<CodEvent["type"], string> = {
  CONTEST: "from-[#2a4aff] via-[#1d34b3] to-[#080f33]",
  TALK: "from-[#0ea5e9] via-[#1e3a8a] to-[#0b1020]",
  WORKSHOP: "from-[#7c3aed] via-[#312e81] to-[#0b0b1f]",
  OTHER: "from-[#334155] via-[#1e293b] to-[#0b0f19]",
};

/**
 * The event's cover image, or a generated one when there's none. The generated
 * cover never repeats the title (it's always printed right next to it); it shows
 * the event type as an oversized outlined watermark instead.
 */
export default function EventCover({
  event,
  className,
  variant = "card",
}: {
  event: Pick<CodEvent, "title" | "type" | "coverImageUrl">;
  className?: string;
  variant?: "card" | "banner" | "hero";
}) {
  if (event.coverImageUrl) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={event.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    );
  }
  const word = EVENT_TYPE_LABEL[event.type].toUpperCase();
  return (
    <div
      aria-hidden
      className={cn("relative overflow-hidden bg-gradient-to-br", gradients[event.type], className)}
    >
      <div className="grid-bg absolute inset-0 opacity-70" />
      <div className="absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-3xl" />
      <span
        className={cn(
          "absolute -bottom-[0.18em] left-3 select-none whitespace-nowrap font-chakra font-bold leading-none text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.35)]",
          variant === "card" && "text-[5.5rem]",
          variant === "banner" && "text-[7rem] sm:text-[11rem]",
          variant === "hero" && "text-[7rem] md:text-[9rem]"
        )}
      >
        {word}
      </span>
      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-2.5 py-1 backdrop-blur-sm">
        <Image src="/images/codes.png" alt="" width={14} height={14} />
        <span className="font-chakra text-[10px] font-semibold uppercase tracking-[0.25em] text-white/80">CODES</span>
      </div>
    </div>
  );
}
