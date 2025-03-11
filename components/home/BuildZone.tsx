"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/*
  A little block sandbox on the hero's ground line.
  - click: drop the selected block (it falls until it lands)
  - right-click / shift+click / long-press: break a block (blocks above fall)
  - 1–8: pick a block · bugs turn around at walls · drop a block on a bug to squash it
  Saved per browser.
*/

export const BLOCKS = [
  { id: "grass", label: "Grass", color: "#5DA144" },
  { id: "dirt", label: "Dirt", color: "#7a5230" },
  { id: "stone", label: "Stone", color: "#7d7f86" },
  { id: "planks", label: "Planks", color: "#a8743f" },
  { id: "brick", label: "Brick", color: "#a8442f" },
  { id: "glass", label: "Glass", color: "#9fd6ef" },
  { id: "gold", label: "Gold", color: "#e8b923" },
  { id: "code", label: "Code", color: "#2a4aff" },
] as const;
type BlockId = (typeof BLOCKS)[number]["id"];

const CELL = 32;
const ROWS = 5;
const GROUND_H = 24;
const STORAGE = "codevents:blocks:v1";

type Bug = { id: number; x: number; dir: 1 | -1; dead: number | null };
type Particle = { id: number; x: number; y: number; color: string; dx: number; dy: number };

const keyOf = (c: number, r: number) => `${c},${r}`;

export default function BuildZone({ pixelFont, textures }: { pixelFont: string; textures: boolean }) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1100);
  const cols = Math.max(8, Math.floor(width / CELL));
  const [blocks, setBlocks] = useState<Record<string, BlockId>>({});
  const blocksRef = useRef(blocks);
  const [selected, setSelected] = useState<BlockId>("grass");
  const [hover, setHover] = useState<{ c: number; r: number } | null>(null);
  const [drops, setDrops] = useState<Record<string, number>>({}); // key -> rows fallen (for animation)
  const [particles, setParticles] = useState<Particle[]>([]);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const bugsRef = useRef<Bug[]>([]);
  const [squashed, setSquashed] = useState(0);
  const [hint, setHint] = useState(true);
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);

  blocksRef.current = blocks;

  // ---- load / save ----
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE) || "[]") as [number, number, BlockId][];
      const next: Record<string, BlockId> = {};
      for (const [c, r, t] of raw) if (r >= 0 && r < ROWS) next[keyOf(c, r)] = t;
      setBlocks(next);
      if (raw.length) setHint(false);
      setSquashed(Number(localStorage.getItem("codevents:squashed") || 0));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      const arr = Object.entries(blocks).map(([k, t]) => [...k.split(",").map(Number), t]);
      localStorage.setItem(STORAGE, JSON.stringify(arr));
    } catch {}
  }, [blocks]);

  // ---- size ----
  useEffect(() => {
    const el = zoneRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---- hotbar keys (only when not typing and the shell isn't open) ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      if (document.querySelector('[aria-label="CODES terminal"]')) return;
      const n = Number(e.key);
      if (n >= 1 && n <= BLOCKS.length) setSelected(BLOCKS[n - 1].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /** Where a block dropped into (c, r) comes to rest, or null if the column is full. */
  const landing = useCallback(
    (c: number, r: number, map = blocksRef.current) => {
      let row = r;
      while (row < ROWS && map[keyOf(c, row)]) row++; // clicked a filled cell: go to the first gap above
      if (row >= ROWS) return null;
      while (row > 0 && !map[keyOf(c, row - 1)]) row--; // fall
      return row;
    },
    []
  );

  const burst = (c: number, r: number, color: string) => {
    const now = Date.now();
    const ps: Particle[] = Array.from({ length: 8 }, (_, i) => ({
      id: now + i,
      x: c * CELL + CELL / 2,
      y: r * CELL + CELL / 2,
      color,
      dx: (Math.random() - 0.5) * 70,
      dy: Math.random() * 50 + 10,
    }));
    setParticles((p) => [...p, ...ps]);
    setTimeout(() => setParticles((p) => p.filter((x) => !ps.includes(x))), 600);
  };

  const squashBug = (b: Bug) => {
    b.dead = Date.now();
    try {
      const n = Number(localStorage.getItem("codevents:squashed") || 0) + 1;
      localStorage.setItem("codevents:squashed", String(n));
      setSquashed(n);
    } catch {
      setSquashed((s) => s + 1);
    }
  };

  function place(c: number, r: number) {
    const row = landing(c, r);
    if (row === null) return;
    const k = keyOf(c, row);
    setBlocks((b) => ({ ...b, [k]: selected }));
    setDrops((d) => ({ ...d, [k]: r - row }));
    setTimeout(() => setDrops((d) => {
      const { [k]: _, ...rest } = d; // eslint-disable-line @typescript-eslint/no-unused-vars
      return rest;
    }), 260);
    setHint(false);
    // landed on a bug?
    if (row === 0) {
      for (const b of bugsRef.current) {
        if (!b.dead && Math.floor(b.x / CELL) === c) squashBug(b);
      }
    }
  }

  function breakAt(c: number, r: number) {
    const k = keyOf(c, r);
    const t = blocksRef.current[k];
    if (!t) return;
    burst(c, r, BLOCKS.find((b) => b.id === t)!.color);
    setBlocks((prev) => {
      const next = { ...prev };
      delete next[k];
      // everything above falls one row
      for (let row = r + 1; row < ROWS; row++) {
        const above = next[keyOf(c, row)];
        if (!above) break;
        next[keyOf(c, row - 1)] = above;
        delete next[keyOf(c, row)];
      }
      return next;
    });
  }

  // ---- bugs: walk the ground row, turn at blocks ----
  useEffect(() => {
    const initial: Bug[] = [0, 1, 2].map((i) => ({ id: i, x: 60 + i * (width / 3), dir: i % 2 ? -1 : 1, dead: null }));
    bugsRef.current = initial;
    setBugs(initial);
    let raf = 0;
    const tick = () => {
      const now = Date.now();
      for (const b of bugsRef.current) {
        if (b.dead) {
          if (now - b.dead > 3000) {
            // respawn at an edge with no block
            b.dead = null;
            b.x = Math.random() < 0.5 ? 6 : width - 30;
            b.dir = b.x < width / 2 ? 1 : -1;
          }
          continue;
        }
        const nextX = b.x + b.dir * 0.7;
        const frontCol = Math.floor((b.dir === 1 ? nextX + 24 : nextX) / CELL);
        if (nextX < 0 || nextX > width - 24 || blocksRef.current[keyOf(frontCol, 0)]) b.dir = (b.dir * -1) as 1 | -1;
        else b.x = nextX;
      }
      setBugs(bugsRef.current.map((b) => ({ ...b })));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [width]);

  // ---- pointer → cell ----
  const cellFrom = (e: React.PointerEvent | React.MouseEvent) => {
    const rect = zoneRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const yFromBottom = rect.bottom - GROUND_H - e.clientY;
    const c = Math.floor(x / CELL);
    const r = Math.floor(yFromBottom / CELL);
    if (c < 0 || c >= cols || r < 0 || r >= ROWS) return null;
    return { c, r };
  };

  const ghostRow = hover ? landing(hover.c, hover.r, blocks) : null;
  const count = Object.keys(blocks).length;
  const sel = useMemo(() => BLOCKS.find((b) => b.id === selected)!, [selected]);

  const blockStyle = (t: BlockId): React.CSSProperties => {
    const b = BLOCKS.find((x) => x.id === t)!;
    return textures
      ? { backgroundImage: `url(/images/sprites/blocks/${t}.png)`, backgroundSize: "100% 100%", imageRendering: "pixelated", backgroundColor: b.color }
      : { backgroundColor: b.color, boxShadow: "inset 3px 3px 0 rgba(255,255,255,0.25), inset -3px -3px 0 rgba(0,0,0,0.3)" };
  };

  return (
    <div className="group/build relative mt-8">
      {/* hotbar: quiet until you hover the ground */}
      <div className={cn("mb-3 flex flex-wrap items-center justify-center gap-1.5 opacity-30 transition-opacity duration-300 focus-within:opacity-100 group-hover/build:opacity-100", pixelFont)}>
        {BLOCKS.map((b, i) => (
          <button
            key={b.id}
            onClick={() => setSelected(b.id)}
            title={`${i + 1} · ${b.label}`}
            className={cn(
              "relative size-10 rounded-sm border-2 p-1 transition-transform",
              selected === b.id ? "-translate-y-1 border-amber-300 bg-white/10" : "border-white/15 bg-black/50 hover:border-white/40"
            )}
          >
            <span className="block size-full" style={blockStyle(b.id)} />
            <span className="absolute -left-1 -top-1 text-[7px] text-neutral-400">{i + 1}</span>
          </button>
        ))}
        <span className="ml-2 hidden text-[8px] text-neutral-500 sm:inline">
          {sel.label.toUpperCase()} · BLOCKS {count} · 🐞 {squashed}
        </span>
        {count > 0 && (
          <button onClick={() => setBlocks({})} className="ml-1 text-[8px] text-neutral-500 hover:text-red-300">
            CLEAR
          </button>
        )}
      </div>

      {/* world */}
      <div
        ref={zoneRef}
        role="application"
        aria-label="Block builder: click to place a block, right-click to break it"
        className="relative cursor-crosshair select-none touch-none"
        style={{ height: ROWS * CELL + GROUND_H }}
        onPointerMove={(e) => setHover(cellFrom(e))}
        onPointerLeave={() => {
          setHover(null);
          if (pressTimer.current) clearTimeout(pressTimer.current);
        }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          const cell = cellFrom(e);
          if (!cell) return;
          longPressed.current = false;
          if (e.pointerType === "touch") {
            pressTimer.current = window.setTimeout(() => {
              longPressed.current = true;
              breakAt(cell.c, cell.r);
            }, 450);
          }
        }}
        onPointerUp={(e) => {
          if (e.button !== 0) return;
          if (pressTimer.current) clearTimeout(pressTimer.current);
          if (longPressed.current) return;
          const cell = cellFrom(e);
          if (!cell) return;
          if (e.shiftKey) breakAt(cell.c, cell.r);
          else place(cell.c, cell.r);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          const cell = cellFrom(e);
          if (cell) breakAt(cell.c, cell.r);
        }}
      >
        {hint && (
          <p className={cn("pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap text-[8px] text-neutral-500 sm:text-[9px]", pixelFont)}>
            CLICK TO BUILD · RIGHT-CLICK TO BREAK · 1–8 PICK A BLOCK
          </p>
        )}

        {/* ghost */}
        {hover && ghostRow !== null && (
          <span
            className="pointer-events-none absolute border-2 border-white/60 opacity-40"
            style={{ left: hover.c * CELL, bottom: GROUND_H + ghostRow * CELL, width: CELL, height: CELL, ...blockStyle(selected) }}
          />
        )}
        {/* hovered existing block outline */}
        {hover && blocks[keyOf(hover.c, hover.r)] && (
          <span
            className="pointer-events-none absolute z-10 border-2 border-white/80"
            style={{ left: hover.c * CELL, bottom: GROUND_H + hover.r * CELL, width: CELL, height: CELL }}
          />
        )}

        {/* blocks */}
        {Object.entries(blocks).map(([k, t]) => {
          const [c, r] = k.split(",").map(Number);
          if (c >= cols) return null;
          const fell = drops[k];
          return (
            <span
              key={k}
              className={cn("pointer-events-none absolute", fell ? "animate-[blockfall_0.25s_ease-in]" : "")}
              style={{
                left: c * CELL,
                bottom: GROUND_H + r * CELL,
                width: CELL,
                height: CELL,
                ["--fall" as string]: `${-(fell ?? 0) * CELL}px`,
                ...blockStyle(t),
              }}
            />
          );
        })}

        {/* bugs */}
        {bugs.map((b) => (
          <span
            key={b.id}
            className={cn("bug-sprite pointer-events-none absolute block size-6 transition-opacity", b.dead && "opacity-0")}
            style={{ left: b.x, bottom: GROUND_H + 2, transform: `rotate(${b.dir === 1 ? 90 : -90}deg)` }}
          />
        ))}

        {/* break particles */}
        {particles.map((p) => (
          <span
            key={p.id}
            className="pointer-events-none absolute size-1.5 animate-[particle_0.55s_ease-out_forwards]"
            style={{ left: p.x, bottom: GROUND_H + p.y, backgroundColor: p.color, ["--dx" as string]: `${p.dx}px`, ["--dy" as string]: `${p.dy}px` }}
          />
        ))}

        {/* ground */}
        <div
          className="absolute inset-x-0 bottom-0 border-t-4 border-[#5DA144] bg-[repeating-linear-gradient(90deg,#3f2a1a_0_16px,#4a3220_16px_32px)]"
          style={{ height: GROUND_H }}
        />
      </div>
    </div>
  );
}
