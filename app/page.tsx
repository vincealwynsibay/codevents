import { listPublicEvents } from "@/lib/server/data";
import { formatDate, getPhase } from "@/lib/domain";
import type { HeroRow } from "@/components/cli/HeroTerminal";
import CalmHero from "@/components/home/CalmHero";
import { SectionsCards } from "@/components/home/HomeSections";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { featured, upcoming, past } = await listPublicEvents();
  const phase = featured ? getPhase(featured) : null;

  const TAGS: Record<string, [string, HeroRow["tone"]]> = {
    REGISTRATION_OPEN: ["OPEN", "ok"],
    REGISTRATION_CLOSED: ["CLOSED", "warn"],
    ONGOING: ["LIVE", "accent"],
  };
  const heroRows: HeroRow[] = [...(featured ? [featured] : []), ...upcoming].map((e) => {
    const [tag, tone] = TAGS[getPhase(e)] ?? ["SOON", "dim"];
    return {
      id: e.id,
      tag,
      tone,
      date: formatDate(e.startDate, { year: undefined }),
      title: e.title,
      spots: e.capacity !== null ? `${e.registrationCount}/${e.capacity}` : `${e.registrationCount} in`,
    };
  });

  return (
    <div className="relative">
      {/* hero backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
        <div className="absolute left-1/2 top-24 size-[520px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      </div>

      {error === "not-admin" && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
            That page is for CODES officers. Ask an owner to add your email if you should have access.
          </p>
        </div>
      )}

      <CalmHero featured={featured} open={phase === "REGISTRATION_OPEN"} rows={heroRows} wide />

      <SectionsCards featured={featured} upcoming={upcoming} past={past} />
    </div>
  );
}
