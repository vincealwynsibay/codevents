import Link from "next/link";
import Home from "@/app/page";
import BgAssets, { BG_VARIANTS, BgVariant } from "@/components/prototype/BgAssets";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prototype · backgrounds", robots: { index: false } };

/**
 * Prototype only: the real home page with a background treatment layered
 * behind it. Switch variants with the pill bar at the bottom (?bg=…).
 */
export default async function PrototypePage({ searchParams }: { searchParams: Promise<{ bg?: string }> }) {
  const { bg } = await searchParams;
  const variant: BgVariant = BG_VARIANTS.some((v) => v.key === bg) ? (bg as BgVariant) : "topo";

  return (
    <>
      <BgAssets variant={variant} />
      <Home searchParams={Promise.resolve({})} />

      <div className="no-print fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
        <nav className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-white/10 bg-black/80 p-1 shadow-2xl backdrop-blur">
          <span className="hidden items-center px-3 font-chakra text-[11px] uppercase tracking-widest text-muted-foreground sm:flex">
            Background
          </span>
          {BG_VARIANTS.map((v) => (
            <Link
              key={v.key}
              href={`/prototype?bg=${v.key}`}
              scroll={false}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 font-chakra text-xs transition-colors",
                variant === v.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {v.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
