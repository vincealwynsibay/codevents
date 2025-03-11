import Link from "next/link";
import { listPublicEvents } from "@/lib/server/data";
import { formatDate, getPhase } from "@/lib/domain";
import type { HeroRow } from "@/components/cli/HeroTerminal";
import CalmHero from "@/components/home/CalmHero";
import { SectionsCards, SectionsShell } from "@/components/home/HomeSections";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prototype · home sections", robots: { index: false } };

const OPTIONS = [
  { id: "shell", label: "A · Shell listings", note: "Sections read like the terminal: cat, ls -l, git log --winners." },
  { id: "cards", label: "B · Clean cards", note: "Typographic cards with a big date block, slim spots bars, podium rows." },
] as const;

export default async function HomeSectionsPrototype({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s } = await searchParams;
  const opt = OPTIONS.find((o) => o.id === s) ?? OPTIONS[0];
  const { featured, upcoming, past } = await listPublicEvents();
  const TAGS: Record<string, [string, HeroRow["tone"]]> = {
    REGISTRATION_OPEN: ["OPEN", "ok"],
    REGISTRATION_CLOSED: ["CLOSED", "warn"],
    ONGOING: ["LIVE", "accent"],
  };
  const rows: HeroRow[] = [...(featured ? [featured] : []), ...upcoming].map((e) => {
    const [tag, tone] = TAGS[getPhase(e)] ?? ["SOON", "dim"];
    return { id: e.id, tag, tone, date: formatDate(e.startDate, { year: undefined }), title: e.title, spots: e.capacity !== null ? `${e.registrationCount}/${e.capacity}` : `${e.registrationCount} in` };
  });

  return (
    <div className="pb-32">
      <CalmHero featured={featured} open={!!featured && getPhase(featured) === "REGISTRATION_OPEN"} rows={rows} wide />
      {opt.id === "shell" ? <SectionsShell featured={featured} upcoming={upcoming} past={past} /> : <SectionsCards featured={featured} upcoming={upcoming} past={past} />}

      <div className="no-print fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        <p className="rounded-full bg-black/80 px-3 py-1 font-mono text-[11px] text-neutral-400 backdrop-blur">{opt.note}</p>
        <nav className="flex gap-1 rounded-full border border-white/10 bg-black/85 p-1 shadow-2xl backdrop-blur">
          {OPTIONS.map((o) => (
            <Link
              key={o.id}
              href={`/prototype/home?s=${o.id}`}
              scroll={false}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 font-chakra text-xs transition-colors",
                opt.id === o.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {o.label}
            </Link>
          ))}
          <Link href="/" className="whitespace-nowrap rounded-full px-3 py-1.5 font-chakra text-xs text-muted-foreground hover:text-foreground">
            current home ↗
          </Link>
        </nav>
      </div>
    </div>
  );
}
