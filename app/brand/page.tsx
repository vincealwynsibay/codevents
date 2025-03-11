import Link from "next/link";
import { Press_Start_2P } from "next/font/google";
import Poster, { FORMATS, PosterFormat } from "@/components/brand/Poster";
import { BRAND, BrandDir, Lockup, Mark, MarkPrompt, MarkStack, WordmarkPrompt, WordmarkStack } from "@/components/brand/Logo";
import { listPublicEvents } from "@/lib/server/data";
import { eventUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], display: "swap" });

export const dynamic = "force-dynamic";
export const metadata = { title: "Brand", robots: { index: false } };

const DIRS: { key: BrandDir; name: string; idea: string }[] = [
  { key: "a", name: "A · Prompt", idea: "The brand is the command line. A >_ tile, a CODEVENTS_ wordmark with a live cursor, posters that are terminal windows." },
  { key: "b", name: "B · Stack", idea: "The brand is the blocks. Three stacked tiles (one still falling), an offset-shadow wordmark, posters led by a big date block." },
];

function Scaled({ format, scale, children }: { format: PosterFormat; scale: number; children: React.ReactNode }) {
  const { w, h } = FORMATS[format];
  return (
    <div className="overflow-hidden rounded-xl border border-white/10" style={{ width: w * scale, height: h * scale }}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "0 0" }}>{children}</div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-16">
      <h2 className="section-label">{label}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default async function BrandPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await searchParams;
  const dir: BrandDir = d === "b" ? "b" : "a";
  const meta = DIRS.find((x) => x.key === dir)!;
  const { featured, upcoming, past } = await listPublicEvents();
  const events = [featured, ...upcoming, ...past].filter(Boolean).slice(0, 3) as NonNullable<typeof featured>[];
  const hero = events[0];

  const Word = dir === "a" ? WordmarkPrompt : WordmarkStack;
  const MarkC = dir === "a" ? MarkPrompt : MarkStack;

  return (
    <div className="mx-auto max-w-[92rem] px-4 pb-32 pt-12 sm:px-6 lg:px-10">
      <p className="font-mono text-sm text-neutral-500">
        <span className="text-emerald-300">$</span> open ~/brand --direction={dir}
      </p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-chakra text-5xl font-bold uppercase tracking-tight sm:text-7xl">{meta.name}</h1>
          <p className="mt-4 max-w-2xl text-neutral-400">{meta.idea}</p>
        </div>
        <nav className="flex gap-1 rounded-full border border-white/10 bg-black/60 p-1">
          {DIRS.map((x) => (
            <Link
              key={x.key}
              href={`/brand?d=${x.key}`}
              className={cn("rounded-full px-4 py-2 font-chakra text-sm uppercase tracking-widest", x.key === dir ? "bg-white text-black" : "text-neutral-400 hover:text-white")}
            >
              {x.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* --- logo --- */}
      <Section label="Logo">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-white/10 lg:col-span-2" style={{ background: BRAND.ink }}>
            <Lockup dir={dir} size={96} textClass="text-6xl sm:text-7xl" />
          </div>
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-white/10" style={{ background: BRAND.blue }}>
            <MarkC size={160} />
          </div>
          <div className="flex min-h-48 items-center justify-center rounded-2xl" style={{ background: BRAND.white }}>
            <span className="inline-flex items-center gap-4">
              <MarkC size={64} />
              <span className="font-chakra text-4xl font-bold uppercase leading-none tracking-tight" style={{ color: BRAND.ink, textShadow: dir === "b" ? `3px 3px 0 ${BRAND.blue}` : undefined }}>
                CODEVENTS{dir === "a" && <span style={{ color: BRAND.blue }}>_</span>}
              </span>
            </span>
          </div>
          <div className="flex min-h-48 items-center justify-center rounded-2xl" style={{ background: BRAND.amber }}>
            <span className="inline-flex items-center gap-4">
              <MarkC size={64} />
              <span className="font-chakra text-4xl font-bold uppercase leading-none tracking-tight" style={{ color: BRAND.ink }}>
                CODEVENTS
              </span>
            </span>
          </div>
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/40">
            <Word className="text-3xl" />
            <span className="font-mono text-xs text-neutral-500">wordmark only</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-8 rounded-2xl border border-white/10 bg-black/40 p-8">
          {[16, 24, 32, 48, 64, 128].map((s) => (
            <div key={s} className="flex flex-col items-center gap-3">
              <Mark dir={dir} size={s} />
              <span className="font-mono text-xs text-neutral-500">{s}px</span>
            </div>
          ))}
          <div className="ml-auto max-w-xs text-sm text-neutral-400">
            The mark works down to favicon size. Keep clear space equal to a quarter of the mark on every side. Don&apos;t
            recolor the tile or rotate it.
          </div>
        </div>
      </Section>

      {/* --- palette + type --- */}
      <Section label="Colour & type">
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              ["Ink", BRAND.ink, "background"],
              ["Panel", BRAND.panel, "surfaces"],
              ["Signal blue", BRAND.blue, "brand · links"],
              ["Arcade amber", BRAND.amber, "one CTA only"],
              ["Paper", BRAND.white, "text"],
            ].map(([n, c, use]) => (
              <div key={n} className="overflow-hidden rounded-2xl border border-white/10">
                <div className="h-28" style={{ background: c }} />
                <div className="p-3">
                  <p className="font-chakra font-semibold">{n}</p>
                  <p className="font-mono text-xs text-neutral-400">{c}</p>
                  <p className="mt-1 text-xs text-neutral-500">{use}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-6">
            <div>
              <p className="font-chakra text-4xl font-bold uppercase">Chakra Petch</p>
              <p className="font-mono text-xs text-neutral-500">display · titles · numbers</p>
            </div>
            <div>
              <p className="text-2xl">Geist Sans</p>
              <p className="font-mono text-xs text-neutral-500">body copy</p>
            </div>
            <div>
              <p className="font-mono text-xl">$ geist mono</p>
              <p className="font-mono text-xs text-neutral-500">shell · metadata</p>
            </div>
            <div>
              <span className={`${pixel.className} inline-block rounded-md bg-amber-300 px-4 py-3 text-[11px] text-black shadow-[0_4px_0_0_#b45309]`}>
                ▶ PRESS START
              </span>
              <p className="mt-2 font-mono text-xs text-neutral-500">Press Start 2P · the one pixel element</p>
            </div>
          </div>
        </div>
      </Section>

      {/* --- posters --- */}
      {hero ? (
        <>
          <Section label={`Posters · ${hero.title}`}>
            <div className="flex flex-wrap items-start gap-6">
              {(["post", "story", "square"] as PosterFormat[]).map((f) => (
                <figure key={f}>
                  <Link href={`/brand/poster/${hero.id}?d=${dir}&f=${f}`} target="_blank">
                    <Scaled format={f} scale={f === "story" ? 0.3 : 0.36}>
                      <Poster dir={dir} format={f} event={hero} url={eventUrl(hero.id)} />
                    </Scaled>
                  </Link>
                  <figcaption className="mt-2 font-mono text-xs text-neutral-500">{FORMATS[f].label}</figcaption>
                </figure>
              ))}
            </div>
          </Section>

          <Section label="Link preview">
            <figure>
              <Scaled format="og" scale={0.6}>
                <Poster dir={dir} format="og" event={hero} url={eventUrl(hero.id)} />
              </Scaled>
              <figcaption className="mt-2 font-mono text-xs text-neutral-500">{FORMATS.og.label}</figcaption>
            </figure>
          </Section>

          {events.length > 1 && (
            <Section label="Series">
              <div className="flex flex-wrap gap-6">
                {events.map((e) => (
                  <Link key={e.id} href={`/brand/poster/${e.id}?d=${dir}&f=post`} target="_blank">
                    <Scaled format="post" scale={0.28}>
                      <Poster dir={dir} format="post" event={e} url={eventUrl(e.id)} />
                    </Scaled>
                  </Link>
                ))}
              </div>
            </Section>
          )}
        </>
      ) : (
        <p className="mt-16 text-neutral-500">No events yet. Seed some to preview posters.</p>
      )}
    </div>
  );
}
