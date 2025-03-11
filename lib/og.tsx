import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/* Link-preview images in the B · Stack brand. Satori only does flexbox and inline styles, so this mirrors the poster by hand. */

export const OG_SIZE = { width: 1200, height: 630 };
const INK = "#05060c";
const BLUE = "#2a4aff";
const AMBER = "#fcd34d";

// Bundled (OFL) so previews render offline and on cold starts; satori needs TTF, not woff2.
async function chakra(): Promise<ArrayBuffer | null> {
  for (const path of [join(process.cwd(), "lib/fonts/ChakraPetch-Bold.ttf"), new URL("./fonts/ChakraPetch-Bold.ttf", import.meta.url)]) {
    try {
      const buf = await readFile(path);
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    } catch {}
  }
  return null;
}

function Block({ color, glass }: { color?: string; glass?: boolean }) {
  return (
    <div
      style={{
        width: 46,
        height: 46,
        borderRadius: 10,
        background: glass ? "rgba(255,255,255,0.08)" : color,
        border: glass ? "3px solid rgba(255,255,255,0.7)" : "none",
      }}
    />
  );
}

function Mark({ size }: { size: number }) {
  const u = size / 64;
  const sq = (x: number, y: number, c: string, glass = false) => (
    <div
      style={{
        position: "absolute",
        left: x * u,
        top: y * u,
        width: 18 * u,
        height: 18 * u,
        borderRadius: 4 * u,
        background: glass ? "rgba(255,255,255,0.12)" : c,
        border: glass ? `${2 * u}px solid rgba(255,255,255,0.75)` : "none",
      }}
    />
  );
  return (
    <div style={{ position: "relative", display: "flex", width: size, height: size, borderRadius: 14 * u, background: "#0b0d18", border: "2px solid rgba(255,255,255,0.14)" }}>
      {sq(13, 34, BLUE)}
      {sq(33, 34, "", true)}
      {sq(23, 12, AMBER)}
    </div>
  );
}

export async function brandOg({ title, tagline, kicker, date }: { title: string; tagline?: string; kicker?: string; date?: { month: string; day: string; wd: string } }) {
  const font = await chakra();
  const display = font ? "Chakra" : "sans-serif";
  const titleSize = title.length > 34 ? 64 : title.length > 20 ? 78 : 96;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: 56, background: INK, color: "white", position: "relative", fontFamily: display }}>
        <div style={{ position: "absolute", right: -260, top: -320, width: 900, height: 900, background: "radial-gradient(circle at center, rgba(42,74,255,0.42) 0%, rgba(42,74,255,0.12) 40%, rgba(5,6,12,0) 70%)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Mark size={52} />
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5, textShadow: `3px 3px 0 ${BLUE}` }}>CODEVENTS</div>
          </div>
          {kicker && <div style={{ fontSize: 18, letterSpacing: 5, color: "#a3a3a3", textTransform: "uppercase" }}>{kicker}</div>}
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 44 }}>
          {date && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 170, height: 200, borderRadius: 26, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 22, letterSpacing: 6, color: "#a3a3a3" }}>{date.month}</div>
              <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1 }}>{date.day}</div>
              <div style={{ fontSize: 22, letterSpacing: 6, color: "#a3a3a3" }}>{date.wd}</div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingRight: 140 }}>
            <div style={{ fontSize: titleSize, fontWeight: 700, lineHeight: 0.95, textTransform: "uppercase", textShadow: `5px 5px 0 ${BLUE}` }}>{title}</div>
            {tagline && <div style={{ marginTop: 22, fontSize: 26, color: "#d4d4d4", fontFamily: "sans-serif", lineHeight: 1.3 }}>{tagline}</div>}
          </div>
        </div>

        <div style={{ position: "absolute", right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
          <div style={{ display: "flex", gap: 5, marginRight: 76 }}>
            <Block color={AMBER} />
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            <Block color={BLUE} />
            <Block color={AMBER} />
            <Block glass />
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            <Block color={BLUE} />
            <Block glass />
            <Block color={BLUE} />
            <Block color={BLUE} />
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: font ? [{ name: "Chakra", data: font, weight: 700, style: "normal" }] : undefined },
  );
}
