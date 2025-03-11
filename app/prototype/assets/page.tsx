/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

export const metadata = { title: "Prototype · assets", robots: { index: false } };

const ASSETS = [
  {
    file: "debuggy.png",
    name: "Debuggy (mascot)",
    use: "Hero, 404, terminal neofetch, empty states",
    prompt: "16-bit pixel mascot: CRT-monitor head with sky-blue pixel eyes, CODES-blue hoodie with </> on the chest, holding a magnifying glass.",
    size: 230,
  },
  {
    file: "bug-crawl.png",
    name: "Bug crawl (4 frames)",
    use: "Debug-mode easter egg (Konami / logo ×5 / `debug`)",
    prompt: "Top-down pixel beetle, red shell with spots, 2×2 crawl cycle; light outline added for the dark theme.",
    sprite: true,
    size: 96,
  },
  { file: "icon-trophy.png", name: "Trophy", use: "Prizes, winners, hall of fame", prompt: "Gold pixel trophy with a star.", size: 96 },
  { file: "icon-laptop.png", name: "Laptop", use: "Contests / hackathons", prompt: "Pixel laptop with </> on a sky-blue screen.", size: 96 },
  { file: "icon-mic.png", name: "Microphone", use: "Talks", prompt: "Silver stage microphone.", size: 96 },
  { file: "icon-tools.png", name: "Tools", use: "Workshops", prompt: "Wrench crossed with an orange screwdriver.", size: 96 },
];

export default function AssetsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="font-mono text-xs text-blue-300">~/codes/public/images/sprites $ ls</p>
      <h1 className="mt-2 font-chakra text-4xl font-bold uppercase">Generated assets</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Made with <span className="text-foreground">agent-sprite-forge</span> through the local Codex image route, then keyed,
        sliced and QA&apos;d by its pipeline (all checks passed). Files live in <code className="text-blue-300">public/images/sprites/</code>.
      </p>
      <div className="mt-4 flex gap-3 font-mono text-xs">
        <Link href="/prototype/hero" className="rounded border border-white/15 px-2 py-1 hover:border-primary/60">→ hero directions</Link>
        <Link href="/prototype" className="rounded border border-white/15 px-2 py-1 hover:border-primary/60">→ backgrounds</Link>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ASSETS.map((a) => (
          <div key={a.file} className="panel overflow-hidden">
            <div className="grid h-64 place-items-center bg-[#0b0c14] [background-image:linear-gradient(45deg,rgba(255,255,255,0.03)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.03)_75%),linear-gradient(45deg,rgba(255,255,255,0.03)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.03)_75%)] [background-position:0_0,12px_12px] [background-size:24px_24px]">
              {a.sprite ? (
                <div className="flex items-center gap-6">
                  <span className="bug-sprite block size-24 [background-size:384px_96px] [animation-name:bugcrawl96]" />
                  <img src={`/images/sprites/${a.file}`} alt="" className="h-12 w-auto [image-rendering:pixelated]" />
                </div>
              ) : (
                <img src={`/images/sprites/${a.file}`} alt={a.name} style={{ height: a.size }} className="w-auto [image-rendering:pixelated]" />
              )}
            </div>
            <div className="space-y-1.5 p-4">
              <p className="font-chakra font-bold">{a.name}</p>
              <p className="font-mono text-xs text-blue-300">/images/sprites/{a.file}</p>
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground">Use:</span> {a.use}
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground">Prompt:</span> {a.prompt}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
