"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/*
  Build mode: the whole page becomes the world.
  Turn it on with `build` in the terminal (or a "codevents:build" event).
  Click to drop a block; it falls until it lands on a heading, card, button,
  the shell window, another block, or the bottom of the page. Blocks remember
  what they landed on, so they move with the layout. Saved per page.
*/

const SIZE = 28;

const TYPES = [
  { id: "blue", label: "Blue", cls: "bg-[#2a4aff] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_14px_-6px_rgba(42,74,255,0.8)]" },
  { id: "violet", label: "Violet", cls: "bg-[#7c3aed] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_14px_-6px_rgba(124,58,237,0.8)]" },
  { id: "cyan", label: "Cyan", cls: "bg-[#06b6d4] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_14px_-6px_rgba(6,182,212,0.8)]" },
  { id: "emerald", label: "Emerald", cls: "bg-[#10b981] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_14px_-6px_rgba(16,185,129,0.8)]" },
  { id: "amber", label: "Amber", cls: "bg-[#f59e0b] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_14px_-6px_rgba(245,158,11,0.8)]" },
  { id: "rose", label: "Rose", cls: "bg-[#f43f5e] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_14px_-6px_rgba(244,63,94,0.8)]" },
  { id: "glass", label: "Glass", cls: "border border-white/40 bg-white/10 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]" },
  { id: "code", label: "Code", cls: "border border-blue-400/40 bg-[#0b0d18] text-[9px] font-mono font-bold text-blue-300 grid place-items-center" },
] as const;
type TypeId = (typeof TYPES)[number]["id"];

// Things blocks can land on.
const SOLID = "h1, h2, h3, p, a[href], img, button, .panel, [data-solid], footer, pre";

type Anchor = { kind: "el"; el: Element; dx: number; dy: number } | { kind: "block"; id: string } | { kind: "floor" };
type Block = { id: string; x: number; type: TypeId; anchor: Anchor };
type Saved = { id: string; x: number; type: TypeId; anchor: { kind: "el"; path: string; dx: number; dy: number } | { kind: "block"; id: string } | { kind: "floor" } };

// --- element path (so blocks survive a reload) ---
function pathOf(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node !== document.body) {
    const parent: Element | null = node.parentElement;
    if (!parent) break;
    const idx = Array.prototype.indexOf.call(parent.children, node) + 1;
    parts.unshift(`${node.tagName.toLowerCase()}:nth-child(${idx})`);
    node = parent;
  }
  return "body > " + parts.join(" > ");
}

const docTop = (el: Element) => el.getBoundingClientRect().top + window.scrollY;
const docLeft = (el: Element) => el.getBoundingClientRect().left + window.scrollX;

export default function BuildMode() {
  const pathname = usePathname();
  const [on, setOn] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const blocksRef = useRef<Block[]>([]);
  const [type, setType] = useState<TypeId>("blue");
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const [, setTick] = useState(0); // re-render on layout change
  const [falling, setFalling] = useState<Record<string, number>>({});
  const storageKey = `codevents:build:${pathname}`;
  blocksRef.current = blocks;

  // ---- toggle ----
  useEffect(() => {
    const toggle = (e: Event) => {
      const want = (e as CustomEvent).detail?.on;
      setOn((v) => (typeof want === "boolean" ? want : !v));
    };
    window.addEventListener("codevents:build", toggle);
    return () => window.removeEventListener("codevents:build", toggle);
  }, []);

  // ---- position of a block in document coordinates ----
  const yOf = useCallback((b: Block, list: Block[], depth = 0): number => {
    if (depth > 200) return document.documentElement.scrollHeight - SIZE;
    if (b.anchor.kind === "floor") return document.documentElement.scrollHeight - SIZE;
    if (b.anchor.kind === "el") {
      if (!b.anchor.el.isConnected) return document.documentElement.scrollHeight - SIZE;
      return docTop(b.anchor.el) + b.anchor.dy;
    }
    const anchorId = b.anchor.id;
    const parent = list.find((p) => p.id === anchorId);
    return parent ? yOf(parent, list, depth + 1) - SIZE : document.documentElement.scrollHeight - SIZE;
  }, []);
  const xOf = useCallback((b: Block) => {
    if (b.anchor.kind === "el" && b.anchor.el.isConnected) return docLeft(b.anchor.el) + b.anchor.dx;
    return b.x;
  }, []);

  // ---- load / save per page ----
  useEffect(() => {
    let saved: Saved[] = [];
    try {
      saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {}
    // wait a frame so the page has laid out
    const t = setTimeout(() => {
      const restored: Block[] = saved.map((s) => {
        if (s.anchor.kind === "el") {
          const el = document.querySelector(s.anchor.path);
          return { id: s.id, x: s.x, type: s.type, anchor: el ? { kind: "el", el, dx: s.anchor.dx, dy: s.anchor.dy } : { kind: "floor" } };
        }
        return { id: s.id, x: s.x, type: s.type, anchor: s.anchor };
      });
      setBlocks(restored);
    }, 300);
    return () => clearTimeout(t);
  }, [storageKey]);

  useEffect(() => {
    const toSave: Saved[] = blocks.map((b) => ({
      id: b.id,
      x: xOf(b),
      type: b.type,
      anchor: b.anchor.kind === "el" ? { kind: "el", path: pathOf(b.anchor.el), dx: b.anchor.dx, dy: b.anchor.dy } : b.anchor,
    }));
    try {
      if (toSave.length) localStorage.setItem(storageKey, JSON.stringify(toSave));
      else localStorage.removeItem(storageKey);
    } catch {}
  }, [blocks, storageKey, xOf]);

  // ---- follow layout changes ----
  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    const ro = new ResizeObserver(bump);
    ro.observe(document.body);
    window.addEventListener("resize", bump);
    const id = window.setInterval(bump, 1000); // catches late-loading content cheaply
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", bump);
      clearInterval(id);
    };
  }, []);

  // ---- keys while building ----
  useEffect(() => {
    if (!on) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      if (e.key === "Escape") setOn(false);
      const n = Number(e.key);
      if (n >= 1 && n <= TYPES.length) setType(TYPES[n - 1].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [on]);

  /** Where a block dropped at document point (px, py) lands, and what it rests on. */
  const resolveLanding = useCallback(
    (px: number, py: number, ignore?: string): { x: number; y: number; anchor: Anchor } => {
      const x = Math.floor(px / SIZE) * SIZE;
      const cx = x + SIZE / 2;
      let bestTop = document.documentElement.scrollHeight;
      let anchor: Anchor = { kind: "floor" };

      // other blocks in the same column
      for (const b of blocksRef.current) {
        if (b.id === ignore) continue;
        const bx = xOf(b);
        if (Math.abs(bx - x) > SIZE / 2) continue;
        const top = yOf(b, blocksRef.current);
        if (top >= py - SIZE / 2 && top < bestTop) {
          bestTop = top;
          anchor = { kind: "block", id: b.id };
        }
      }
      // page elements
      document.querySelectorAll(SOLID).forEach((el) => {
        const h = el as HTMLElement;
        // skip our own UI, the sticky navbar and anything fixed on screen (it moves when you scroll)
        if (h.closest("[data-build-ui], header, [aria-label='CODES terminal']")) return;
        if (getComputedStyle(h).position === "fixed" || h.closest(".fixed")) return;
        const r = el.getBoundingClientRect();
        if (r.width < SIZE || r.height < 8) return;
        const left = r.left + window.scrollX;
        const top = r.top + window.scrollY;
        if (cx < left || cx > left + r.width) return;
        if (top >= py - SIZE / 2 && top < bestTop) {
          bestTop = top;
          anchor = { kind: "el", el, dx: x - left, dy: -SIZE };
        }
      });
      return { x, y: bestTop - SIZE, anchor };
    },
    [xOf, yOf]
  );

  const pointToDoc = (e: React.PointerEvent | React.MouseEvent) => ({ px: e.clientX + window.scrollX, py: e.clientY + window.scrollY });

  const blockAt = (px: number, py: number) =>
    blocksRef.current.find((b) => {
      const bx = xOf(b);
      const by = yOf(b, blocksRef.current);
      return px >= bx && px < bx + SIZE && py >= by && py < by + SIZE;
    });

  function drop(px: number, py: number) {
    const hit = blockAt(px, py);
    // clicked an existing block: stack on top of it
    const land = hit ? { x: xOf(hit), y: yOf(hit, blocksRef.current) - SIZE, anchor: { kind: "block", id: hit.id } as Anchor } : resolveLanding(px, py);
    if (land.y < 0) return;
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    setBlocks((bs) => [...bs, { id, x: land.x, type, anchor: land.anchor }]);
    const fell = Math.max(0, land.y - (py - SIZE / 2));
    setFalling((f) => ({ ...f, [id]: fell }));
    setTimeout(() => setFalling((f) => {
      const { [id]: _, ...rest } = f; // eslint-disable-line @typescript-eslint/no-unused-vars
      return rest;
    }), 320);
  }

  function breakBlock(target: Block) {
    setBlocks((bs) => {
      const rest = bs.filter((b) => b.id !== target.id);
      // whatever rested on it falls onto whatever was under it
      return rest.map((b) => (b.anchor.kind === "block" && b.anchor.id === target.id ? { ...b, anchor: target.anchor, x: xOf(target) } : b));
    });
  }

  const count = blocks.length;

  return (
    <>
      {/* block layer, in document coordinates */}
      <div aria-hidden className="pointer-events-none absolute left-0 top-0 z-[55] h-0 w-full" data-build-ui>
        {blocks.map((b) => {
          const t = TYPES.find((x) => x.id === b.type)!;
          const fell = falling[b.id];
          return (
            <span
              key={b.id}
              className={cn("absolute rounded-[5px]", t.cls, fell ? "animate-[blockfall_0.3s_cubic-bezier(.5,0,.75,0)]" : "")}
              style={{ left: xOf(b), top: yOf(b, blocks), width: SIZE, height: SIZE, ["--fall" as string]: `${-(fell ?? 0)}px` }}
            >
              {b.type === "code" ? "</>" : null}
            </span>
          );
        })}
        {on && ghost && (
          <span
            className={cn("absolute rounded-[5px] opacity-40 outline outline-2 outline-white/70", TYPES.find((x) => x.id === type)!.cls)}
            style={{ left: ghost.x, top: ghost.y, width: SIZE, height: SIZE }}
          />
        )}
      </div>

      {on && (
        <>
          {/* input layer */}
          <div
            data-build-ui
            className="fixed inset-0 z-[56] cursor-crosshair"
            onPointerMove={(e) => {
              const { px, py } = pointToDoc(e);
              const hit = blockAt(px, py);
              setGhost(hit ? { x: xOf(hit), y: yOf(hit, blocksRef.current) - SIZE } : (() => {
                const l = resolveLanding(px, py);
                return { x: l.x, y: l.y };
              })());
            }}
            onPointerLeave={() => setGhost(null)}
            onClick={(e) => {
              const { px, py } = pointToDoc(e);
              const hit = blockAt(px, py);
              if (e.shiftKey && hit) breakBlock(hit);
              else if (!e.shiftKey) drop(px, py);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              const { px, py } = pointToDoc(e);
              const hit = blockAt(px, py);
              if (hit) breakBlock(hit);
            }}
          />

          {/* hotbar */}
          <div data-build-ui className="fixed inset-x-0 bottom-4 z-[57] flex justify-center px-4">
            <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-black/85 p-2 shadow-2xl backdrop-blur">
              <span className="hidden px-2 font-mono text-[11px] text-neutral-400 sm:block">build mode</span>
              {TYPES.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  title={`${i + 1} · ${t.label}`}
                  className={cn(
                    "relative size-9 rounded-lg p-1.5 transition-all",
                    type === t.id ? "-translate-y-0.5 bg-white/15 ring-2 ring-white/60" : "hover:bg-white/10"
                  )}
                >
                  <span className={cn("block size-full rounded-[4px]", t.cls)}>{t.id === "code" ? "</>" : null}</span>
                  <span className="absolute -right-0.5 -top-0.5 font-mono text-[9px] text-neutral-500">{i + 1}</span>
                </button>
              ))}
              <span className="px-2 font-mono text-[11px] tabular-nums text-neutral-400">{count}</span>
              {count > 0 && (
                <button onClick={() => setBlocks([])} className="rounded-md px-2 py-1 font-mono text-[11px] text-neutral-400 hover:bg-white/10 hover:text-red-300">
                  clear
                </button>
              )}
              <button onClick={() => setOn(false)} className="rounded-md px-2 py-1 font-mono text-[11px] text-neutral-300 hover:bg-white/10">
                done <kbd className="ml-1 rounded border border-white/15 px-1 text-[10px]">esc</kbd>
              </button>
            </div>
          </div>
          <div data-build-ui className="pointer-events-none fixed inset-x-0 top-20 z-[57] flex justify-center">
            <p className="rounded-full bg-black/80 px-3 py-1 font-mono text-[11px] text-neutral-400 backdrop-blur">
              click to drop · right-click or shift-click to break · 1–8 pick · links are paused while you build
            </p>
          </div>
        </>
      )}
    </>
  );
}
