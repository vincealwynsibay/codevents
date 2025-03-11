import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Numbered section header: "01 / COMING UP ────────── View all →" */
export default function SectionHeader({
  index,
  title,
  href,
  linkLabel = "View all",
}: {
  index: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <span className="font-chakra text-xs font-semibold tracking-[0.2em] text-blue-300/80">{index}</span>
      <h2 className="font-chakra text-2xl font-bold uppercase tracking-wide">{title}</h2>
      <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
      {href && (
        <Link
          href={href}
          className="group flex items-center gap-1 font-chakra text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
        >
          {linkLabel} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
