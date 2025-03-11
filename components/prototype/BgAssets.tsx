// Prototype background treatments for the existing dark UI.
// Original SVGs, loosely inspired by the warm, local feel of PyCon Davao:
// topographic lines, a Davao horizon, a Mindanao-style geometric weave, and
// sun/ring motifs, all recolored to sit quietly behind the dark theme.

export const BG_VARIANTS = [
  { key: "none", label: "Current" },
  { key: "topo", label: "Topo lines" },
  { key: "horizon", label: "Davao horizon" },
  { key: "weave", label: "Geometric weave" },
  { key: "motifs", label: "Sun & shapes" },
  { key: "combo", label: "Topo + horizon + shapes" },
] as const;

export type BgVariant = (typeof BG_VARIANTS)[number]["key"];

const topoSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='640' viewBox='0 0 640 640' fill='none' stroke='%237C8CFF' stroke-opacity='0.13' stroke-width='1.2'%3E%3Cpath d='M-20 90c90-40 180 30 270 0s180-70 270-20 100 40 140 30'/%3E%3Cpath d='M-20 130c90-40 180 30 270 0s180-70 270-20 100 40 140 30'/%3E%3Cpath d='M-20 170c90-40 180 30 270 0s180-70 270-20 100 40 140 30'/%3E%3Cpath d='M-20 330c80 30 160-40 250-10s170 60 260 20 100-30 170-10'/%3E%3Cpath d='M-20 370c80 30 160-40 250-10s170 60 260 20 100-30 170-10'/%3E%3Cpath d='M-20 550c100-30 170 40 270 10s190-60 270-10 90 30 140 20'/%3E%3Ccircle cx='500' cy='230' r='30'/%3E%3Ccircle cx='500' cy='230' r='54'/%3E%3Ccircle cx='500' cy='230' r='80'/%3E%3Ccircle cx='130' cy='460' r='24'/%3E%3Ccircle cx='130' cy='460' r='46'/%3E%3C/svg%3E")`;

const weaveSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Cg fill='none' stroke='%237C8CFF' stroke-opacity='0.12' stroke-width='1.5'%3E%3Cpath d='M48 8l20 20-20 20-20-20z'/%3E%3Cpath d='M48 18l10 10-10 10-10-10z'/%3E%3Cpath d='M0 48l20 20L0 88M96 48L76 68l20 20'/%3E%3Cpath d='M8 0l10 12L28 0M68 0l10 12L88 0'/%3E%3Cpath d='M28 96l20-20 20 20'/%3E%3C/g%3E%3Ccircle cx='48' cy='28' r='2' fill='%23F99508' fill-opacity='0.35'/%3E%3Ccircle cx='0' cy='68' r='2' fill='%230396E0' fill-opacity='0.35'/%3E%3Ccircle cx='96' cy='68' r='2' fill='%230396E0' fill-opacity='0.35'/%3E%3C/svg%3E")`;

function Topo() {
  return <div className="absolute inset-0" style={{ backgroundImage: topoSvg, backgroundSize: "640px 640px" }} />;
}

function Weave() {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: weaveSvg,
        backgroundSize: "96px 96px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 20%, black 20%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 20%, black 20%, transparent 75%)",
      }}
    />
  );
}

/** Layered night-time ridgelines along the bottom of the viewport. */
function Horizon() {
  return (
    <svg viewBox="0 0 1440 260" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[30vh] w-full">
      <defs>
        <linearGradient id="h1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#2a4aff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#2a4aff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="h2" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7c3aed" stopOpacity="0.2" />
          <stop offset="1" stopColor="#0a0a0a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 260V150l120-50 110 40 150-90 130 70 90-30 160 100 120-60 140 50 150-80 130 60 140-40v150z" fill="url(#h2)" />
      <path d="M0 260V180l160-40 120 30 140-80 100 50 160-60 120 70 130-40 150 60 140-50 120 30 100-20v130z" fill="url(#h1)" />
      <path d="M520 260l220-190 40 22 30-16 230 184z" fill="#2a4aff" fillOpacity="0.12" />
      <path d="M0 260v-40l200-30 180 20 200-30 240 30 220-20 200 25 200-15v60z" fill="#0d1033" fillOpacity="0.9" />
    </svg>
  );
}

function Motifs() {
  return (
    <>
      <svg viewBox="0 0 200 200" className="absolute -left-16 top-24 w-72 opacity-40">
        <g fill="none" stroke="#F99508" strokeOpacity="0.5" strokeWidth="1.5">
          <circle cx="100" cy="100" r="36" />
          <circle cx="100" cy="100" r="56" strokeDasharray="4 10" />
          <circle cx="100" cy="100" r="80" strokeOpacity="0.3" />
        </g>
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x="99" y="4" width="2" height="12" rx="1" fill="#F99508" fillOpacity="0.45" transform={`rotate(${i * 30} 100 100)`} />
        ))}
      </svg>
      <svg viewBox="0 0 200 200" className="absolute -right-20 top-[45vh] w-96 opacity-30">
        <g fill="none" stroke="#7C8CFF" strokeWidth="1.5">
          <circle cx="100" cy="100" r="40" />
          <circle cx="100" cy="100" r="64" strokeDasharray="2 8" />
          <circle cx="100" cy="100" r="90" />
        </g>
      </svg>
      <svg viewBox="0 0 400 300" className="absolute right-[6%] top-20 w-64 opacity-70">
        <path d="M30 60l16-26 16 26z" fill="#F99508" fillOpacity="0.55" />
        <rect x="300" y="30" width="18" height="18" rx="3" fill="#0396E0" fillOpacity="0.5" transform="rotate(20 309 39)" />
        <circle cx="360" cy="200" r="8" fill="#a78bfa" fillOpacity="0.5" />
        <path d="M120 250a18 18 0 0 1 36 0z" fill="#5DA144" fillOpacity="0.5" />
        <path d="M230 120l9 13-9 13-9-13z" fill="#F99508" fillOpacity="0.45" />
      </svg>
      <svg viewBox="0 0 300 200" className="absolute bottom-[12vh] left-[5%] w-56 opacity-60">
        <rect x="20" y="40" width="14" height="14" rx="3" fill="#a78bfa" fillOpacity="0.45" transform="rotate(30 27 47)" />
        <path d="M200 160l14-24 14 24z" fill="#0396E0" fillOpacity="0.45" />
        <circle cx="120" cy="60" r="6" fill="#F99508" fillOpacity="0.5" />
      </svg>
    </>
  );
}

/** Fixed layer behind the page content. */
export default function BgAssets({ variant }: { variant: BgVariant }) {
  if (variant === "none") return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-[1] overflow-hidden">
      {(variant === "topo" || variant === "combo") && <Topo />}
      {variant === "weave" && <Weave />}
      {(variant === "horizon" || variant === "combo") && <Horizon />}
      {(variant === "motifs" || variant === "combo") && <Motifs />}
    </div>
  );
}
