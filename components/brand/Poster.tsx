import QRCode from "qrcode";
import { Press_Start_2P } from "next/font/google";
import { CodEvent, EVENT_TYPE_LABEL, PLACE_LABEL, formatDate, formatTime } from "@/lib/domain";
import { BRAND, BrandDir, MarkPrompt, MarkStack, WordmarkPrompt, WordmarkStack } from "./Logo";

const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], display: "swap" });

export type PosterFormat = "post" | "story" | "square" | "og";
export const FORMATS: Record<PosterFormat, { w: number; h: number; label: string }> = {
  post: { w: 1080, h: 1350, label: "Instagram post · 1080×1350" },
  story: { w: 1080, h: 1920, label: "Story · 1080×1920" },
  square: { w: 1080, h: 1080, label: "Square · 1080×1080" },
  og: { w: 1200, h: 630, label: "Link preview · 1200×630" },
};

const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function qrSvg(url: string) {
  return QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#05060c", light: "#ffffff" } });
}

function Qr({ svg, size }: { svg: string; size: number }) {
  return (
    <div
      className="shrink-0 rounded-xl bg-white p-2 [&_svg]:h-full [&_svg]:w-full"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

const grid = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
  backgroundSize: "48px 48px",
};

export default async function Poster({ dir, format, event, url }: { dir: BrandDir; format: PosterFormat; event: CodEvent; url: string }) {
  const { w, h } = FORMATS[format];
  const svg = await qrSvg(url);
  return (
    <div
      id="poster"
      className="relative overflow-hidden text-white"
      style={{ width: w, height: h, background: BRAND.ink }}
    >
      {dir === "a" ? <PromptPoster format={format} event={event} svg={svg} url={url} /> : <StackPoster format={format} event={event} svg={svg} url={url} />}
    </div>
  );
}

// ===========================================================================
// A · Prompt — the poster is a terminal window
// ===========================================================================
function PromptPoster({ format, event, svg, url }: { format: PosterFormat; event: CodEvent; svg: string; url: string }) {
  const og = format === "og";
  const tall = format === "story";
  const sq = format === "square";
  const pad = og ? 48 : sq ? 56 : 72;
  const titleSize = og ? 72 : tall ? 156 : sq ? 84 : 118;
  const first = event.prizes.find((p) => p.place === 1);
  const rows: [string, string][] = [
    ["when", `${formatDate(event.startDate, { weekday: "short" })} · ${formatTime(event.startDate)}`],
    ["where", event.venue],
    ["format", event.participation === "TEAM" ? `teams of ${event.teamMin}–${event.teamMax}` : "solo"],
    ...(first ? ([["1st prize", first.title]] as [string, string][]) : []),
  ];
  const short = new URL(url).host;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ ...grid, padding: pad }}>
      <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(closest-side, rgba(42,74,255,0.35), transparent)" }} />

      {/* the window */}
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-[28px] border border-white/15 bg-black/70 font-mono" style={{ boxShadow: "0 60px 120px -40px rgba(42,74,255,0.6)" }}>
        <div className="flex items-center gap-3 border-b border-white/10 px-7 py-5">
          <span className="size-4 rounded-full bg-white/20" />
          <span className="size-4 rounded-full bg-white/20" />
          <span className="size-4 rounded-full bg-white/20" />
          <span className="ml-3 truncate text-neutral-400" style={{ fontSize: og ? 18 : 22 }}>
            codes@umtc: ~/events/{slug(event.title)}
          </span>
        </div>

        <div className={og ? "grid flex-1 grid-cols-[1.4fr_1fr] gap-10 p-10" : (sq ? "flex flex-1 flex-col p-10" : tall ? "flex flex-1 flex-col justify-center gap-16 p-14" : "flex flex-1 flex-col p-12")}>
          <div className="flex min-w-0 flex-col">
            <p className="text-neutral-500" style={{ fontSize: og ? 20 : 26 }}>
              <span style={{ color: "#6ee7b7" }}>$</span> cat {slug(event.title)}.txt
            </p>
            <p className="mt-3 uppercase tracking-[0.3em]" style={{ color: BRAND.amber, fontSize: og ? 16 : 22 }}>
              {EVENT_TYPE_LABEL[event.type]} · CODES UM Tagum
            </p>
            <h1
              className="mt-6 font-chakra font-bold uppercase leading-[0.92] tracking-tight"
              style={{ fontSize: titleSize, textShadow: `5px 5px 0 ${BRAND.blue}` }}
            >
              {event.title}
            </h1>
            {event.tagline && !og && (
              <p className="mt-6 text-neutral-300" style={{ fontSize: tall ? 36 : sq ? 26 : 30, lineHeight: 1.35 }}>
                {event.tagline}
              </p>
            )}
            {!og && (
              <dl className={sq ? "mt-6 grid gap-2" : "mt-10 grid gap-3"} style={{ fontSize: tall ? 34 : sq ? 24 : 28 }}>
                {(sq ? rows.slice(0, 2) : rows).map(([k, v]) => (
                  <div key={k} className="flex gap-6">
                    <dt className="w-40 shrink-0 text-neutral-500">{k}</dt>
                    <dd className="text-neutral-100">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <div className={og ? "flex flex-col justify-between" : (tall ? "flex items-end justify-between gap-8" : sq ? "mt-auto flex items-end justify-between gap-8 pt-6" : "mt-auto flex items-end justify-between gap-8 pt-10")}>
            {og && (
              <dl className="grid gap-2" style={{ fontSize: 20 }}>
                {rows.slice(0, 3).map(([k, v]) => (
                  <div key={k} className="flex gap-4">
                    <dt className="w-24 shrink-0 text-neutral-500">{k}</dt>
                    <dd className="truncate text-neutral-100">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div>
              <span
                className={`${pixel.className} inline-block rounded-lg px-6 py-5 text-black`}
                style={{ background: BRAND.amber, boxShadow: "0 6px 0 0 #b45309", fontSize: og ? 16 : 22 }}
              >
                ▶ PRESS START
              </span>
              <p className="mt-5 text-neutral-500" style={{ fontSize: og ? 16 : 22 }}>
                {short}
              </p>
            </div>
            {!og && <Qr svg={svg} size={tall ? 300 : sq ? 170 : 220} />}
          </div>
        </div>
      </div>

      {/* footer lockup */}
      <div className="relative mt-8 flex items-center justify-between">
        <span className="flex items-center gap-4">
          <MarkPrompt size={og ? 44 : 60} />
          <WordmarkPrompt className={og ? "text-3xl" : "text-4xl"} />
        </span>
        <span className="font-mono text-neutral-500" style={{ fontSize: og ? 16 : 22 }}>
          Computer Debugger&apos;s Society · UM Tagum
        </span>
      </div>
    </div>
  );
}

// ===========================================================================
// B · Stack — big date, big title, the blocks as decoration
// ===========================================================================
function Blocks({ scale = 1 }: { scale?: number }) {
  const s = 96 * scale;
  const gap = 10 * scale;
  const B = ({ x, y, kind }: { x: number; y: number; kind: "blue" | "glass" | "amber" }) => (
    <div
      className="absolute rounded-[18px]"
      style={{
        left: x * (s + gap),
        bottom: y * (s + gap),
        width: s,
        height: s,
        background: kind === "blue" ? BRAND.blue : kind === "amber" ? BRAND.amber : "rgba(255,255,255,0.08)",
        border: kind === "glass" ? "3px solid rgba(255,255,255,0.7)" : undefined,
        boxShadow: kind === "blue" ? "0 20px 40px -12px rgba(42,74,255,0.8), inset 0 3px 0 rgba(255,255,255,0.3)" : kind === "amber" ? "0 20px 40px -12px rgba(245,158,11,0.7), inset 0 3px 0 rgba(255,255,255,0.45)" : "inset 0 3px 0 rgba(255,255,255,0.4)",
      }}
    />
  );
  return (
    <div className="relative" style={{ width: 4 * (s + gap), height: 3 * (s + gap) }}>
      <B x={0} y={0} kind="blue" />
      <B x={1} y={0} kind="glass" />
      <B x={2} y={0} kind="blue" />
      <B x={3} y={0} kind="blue" />
      <B x={1} y={1} kind="blue" />
      <B x={2} y={1} kind="amber" />
      <B x={3} y={1} kind="glass" />
      <B x={2.5} y={2.15} kind="amber" />
    </div>
  );
}

function StackPoster({ format, event, svg, url }: { format: PosterFormat; event: CodEvent; svg: string; url: string }) {
  const og = format === "og";
  const tall = format === "story";
  const sq = format === "square";
  const pad = og ? 56 : sq ? 64 : 80;
  const titleSize = og ? 84 : tall ? 170 : sq ? 92 : 132;
  const month = formatDate(event.startDate, { month: "short", day: undefined, year: undefined }).toUpperCase();
  const day = formatDate(event.startDate, { day: "numeric", month: undefined, year: undefined });
  const wd = formatDate(event.startDate, { weekday: "short", day: undefined, month: undefined, year: undefined }).toUpperCase();
  const first = event.prizes.find((p) => p.place === 1);
  const short = new URL(url).host;

  return (
    <div className="absolute inset-0 flex flex-col" style={{ padding: pad }}>
      <div className="absolute -right-40 -top-40 size-[760px] rounded-full" style={{ background: "radial-gradient(closest-side, rgba(42,74,255,0.4), transparent)" }} />
      <div className="absolute -bottom-60 -left-40 size-[700px] rounded-full" style={{ background: "radial-gradient(closest-side, rgba(252,211,77,0.12), transparent)" }} />

      <div className="relative flex items-center justify-between">
        <span className="flex items-center gap-4">
          <MarkStack size={og ? 48 : 64} />
          <WordmarkStack className={og ? "text-3xl" : "text-4xl"} shadow={3} />
        </span>
        <span className="font-chakra uppercase tracking-[0.25em] text-neutral-400" style={{ fontSize: og ? 16 : 22 }}>
          {EVENT_TYPE_LABEL[event.type]}
        </span>
      </div>

      <div className={og ? "relative mt-10 grid flex-1 grid-cols-[auto_1fr] items-center gap-10" : (tall ? "relative flex flex-1 flex-col justify-center" : sq ? "relative mt-8 flex flex-1 flex-col" : "relative mt-16 flex flex-1 flex-col")}>
        {/* date block */}
        <div
          className="flex w-fit flex-col items-center justify-center rounded-[28px] border border-white/15 bg-white/[0.04] font-chakra"
          style={{ width: og ? 170 : sq ? 170 : tall ? 260 : 220, height: og ? 200 : sq ? 190 : tall ? 300 : 260 }}
        >
          <span className="tracking-[0.3em] text-neutral-400" style={{ fontSize: og ? 22 : 28 }}>{month}</span>
          <span className="font-bold leading-none" style={{ fontSize: og || sq ? 96 : tall ? 150 : 128 }}>{day}</span>
          <span className="tracking-[0.3em] text-neutral-400" style={{ fontSize: og ? 22 : 28 }}>{wd}</span>
        </div>

        <div className={og ? "min-w-0" : sq ? "mt-8" : "mt-12"}>
          <h1 className="font-chakra font-bold uppercase leading-[0.9] tracking-tight" style={{ fontSize: titleSize, textShadow: `6px 6px 0 ${BRAND.blue}` }}>
            {event.title}
          </h1>
          {event.tagline && (
            <p className="mt-6 max-w-[860px] text-neutral-300" style={{ fontSize: og ? 24 : tall ? 40 : sq ? 28 : 34, lineHeight: 1.3 }}>
              {event.tagline}
            </p>
          )}
          <div className={sq ? "mt-5 flex flex-wrap gap-3 font-chakra" : "mt-8 flex flex-wrap gap-3 font-chakra"} style={{ fontSize: og || sq ? 18 : tall ? 28 : 24 }}>
            {[formatTime(event.startDate), event.venue, ...(first ? [`${PLACE_LABEL[1]}: ${first.title}`] : [])].map((t) => (
              <span key={t} className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-2 text-neutral-200">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {!og && (
        <>
          <div className="pointer-events-none absolute bottom-0 right-0">
            <Blocks scale={tall ? 0.95 : format === "square" ? 0.55 : 0.7} />
          </div>
          <div className="relative mt-auto flex items-end gap-6 pt-10">
            <Qr svg={svg} size={tall ? 240 : format === "square" ? 170 : 200} />
            <div className="pb-2">
              <p className="font-chakra font-bold uppercase" style={{ fontSize: 34 }}>
                Scan to register
              </p>
              <p className="mt-2 font-mono text-neutral-400" style={{ fontSize: 22 }}>
                {short}
              </p>
            </div>
          </div>
        </>
      )}
      {og && (
        <div className="absolute bottom-0 right-0 opacity-90">
          <Blocks scale={0.45} />
        </div>
      )}
    </div>
  );
}
