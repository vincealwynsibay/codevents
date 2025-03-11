/*
  Two brand directions for codevents.
  A · Prompt — the brand is the command line: a ">_" tile and a CODEVENTS_ wordmark.
  B · Stack  — the brand is the build-mode blocks: three stacked blocks and an offset-shadow wordmark.
  Pure SVG/CSS so they render crisply at any size and export cleanly.
*/
import { cn } from "@/lib/utils";

export type BrandDir = "a" | "b";

export const BRAND = {
  ink: "#05060c",
  panel: "#0b0d18",
  blue: "#2a4aff",
  blueDeep: "#152580",
  amber: "#fcd34d",
  white: "#f5f7ff",
  muted: "#8b93a7",
};

// ---------------------------------------------------------------------------
// A · Prompt
// ---------------------------------------------------------------------------
export function MarkPrompt({ size = 64, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-label="codevents">
      <rect x="1" y="1" width="62" height="62" rx="14" fill={BRAND.panel} stroke="rgba(255,255,255,0.14)" strokeWidth="2" />
      <path d="M15 21 L27 32 L15 43" fill="none" stroke={BRAND.white} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="32" y="39" width="18" height="6" rx="1.5" fill={BRAND.blue} />
    </svg>
  );
}

export function WordmarkPrompt({ className }: { className?: string }) {
  return (
    <span className={cn("font-chakra font-bold uppercase leading-none tracking-tight text-white", className)}>
      CODEVENTS<span style={{ color: BRAND.blue }}>_</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// B · Stack
// ---------------------------------------------------------------------------
export function MarkStack({ size = 64, className, tile = true }: { size?: number; className?: string; tile?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-label="codevents">
      {tile && <rect x="1" y="1" width="62" height="62" rx="14" fill={BRAND.panel} stroke="rgba(255,255,255,0.14)" strokeWidth="2" />}
      {/* bottom-left: blue */}
      <rect x="13" y="34" width="18" height="18" rx="4" fill={BRAND.blue} />
      {/* bottom-right: glass */}
      <rect x="33" y="34" width="18" height="18" rx="4" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.75)" strokeWidth="2" />
      {/* top: amber, dropping in */}
      <rect x="23" y="12" width="18" height="18" rx="4" fill={BRAND.amber} />
    </svg>
  );
}

export function WordmarkStack({ className, shadow = 4 }: { className?: string; shadow?: number }) {
  return (
    <span
      className={cn("font-chakra font-bold uppercase leading-none tracking-tight text-white", className)}
      style={{ textShadow: `${shadow}px ${shadow}px 0 ${BRAND.blue}` }}
    >
      CODEVENTS
    </span>
  );
}

// ---------------------------------------------------------------------------
export function Mark({ dir, size, className }: { dir: BrandDir; size?: number; className?: string }) {
  return dir === "a" ? <MarkPrompt size={size} className={className} /> : <MarkStack size={size} className={className} />;
}

export function Lockup({ dir, size = 56, textClass = "text-4xl" }: { dir: BrandDir; size?: number; textClass?: string }) {
  return (
    <span className="inline-flex items-center gap-4">
      <Mark dir={dir} size={size} />
      {dir === "a" ? <WordmarkPrompt className={textClass} /> : <WordmarkStack className={textClass} />}
    </span>
  );
}
