"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/*
  Build mode, always on (desktop).
  Click empty space or plain text to drop a block; it falls until it lands on a
  heading, text, a card, a button, the shell window, another block or the page
  bottom. Links, buttons, inputs and cards keep working normally. Right-click a
  block to break it. Three colours, 80 blocks per page (oldest goes first).
  Blocks remember what they landed on, so they follow the layout. Saved per page.
  `build off` / `build` in the shell, or the switch in the corner, turns it off/on.
*/

const SIZE = 26;
const MAX_BLOCKS = 80;

const TYPES = [
  { id: "blue", label: "CODES blue", cls: "bg-[#2a4aff] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_14px_-6px_rgba(42,74,255,0.8)]" },
  { id: "glass", label: "Glass", cls: "border border-white/40 bg-white/10 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]" },
  { id: "amber", label: "Amber", cls: "bg-[#fcd34d] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_6px_14px_-6px_rgba(245,158,11,0.8)]" },
] as const;
type TypeId = (typeof TYPES)[number]["id"];

// What blocks can land on.
const SOLID = "h1, h2, h3, p, a[href], img, button, .panel, [data-solid], footer, pre";
// Clicks on these keep their normal behaviour (never drop a block).
const INTERACTIVE =
  "a, button, input, textarea, select, label, summary, [role=button], [role=dialog], [contenteditable], [data-build-ui], header, [aria-label='CODES terminal'], [aria-label^='Game'], [aria-label^='Block builder']";

type Anchor = { kind: "el"; el: Element; dx: number; dy: number } | { kind: "block"; id: string } | { kind: "floor" };
type Block = { id: string; x: number; type: TypeId; anchor: Anchor };
type Saved = { id: string; x: number; type: TypeId; anchor: { kind: "el"; path: string; dx: number; dy: number } | { kind: "block"; id: string } | { kind: "floor" } };

function pathOf(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node !== document.body) {
    const parent: Element | null = node.parentElement;
    if (!parent) break;
    parts.unshift(`${node.tagName.toLowerCase()}:nth-child(${Array.prototype.indexOf.call(parent.children, node) + 1})`);
    node = parent;
  }
  return "body > " + parts.join(" > ");
}
const docTop = (el: Element) => el.getBoundingClientRect().top + window.scrollY;
const docLeft = (el: Element) => el.getBoundingClientRect().left + window.scrollX;

export default function BuildMode() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false); // decided after mount (desktop + not switched off)
  const [blocks, setBlocks] = useState<Block[]>([]);
  const blocksRef = useRef<Block[]>([]);
  const [type, setType] = useState<TypeId>("blue");
  const typeRef = useRef<TypeId>("blue");
  const [, setTick] = useState(0);
  const [falling, setFalling] = useState<Record<string, number>>({});
  const [tip, setTip] = useState(false);
  const storageKey = `codevents:build:${pathname}`;
  blocksRef.current = blocks;
  typeRef.current = type;

  // ---- on by default on desktop; remembers if you switched it off ----
  useEffect(() => {
    let off = false;
    try {
      off = localStorage.getItem("codevents:build:off") === "1";
      if (!off && !localStorage.getItem("codevents:build:tip")) setTip(true);
    } catch {}
    setEnabled(!off && window.matchMedia("(pointer: fine)").matches);
    const toggle = (e: Event) => {
      const want = (e as CustomEvent).detail?.on;
      setEnabled((v) => {
        const next = typeof want === "boolean" ? want : !v;
        try {
          localStorage.setItem("codevents:build:off", next ? "0" : "1");
        } catch {}
        return next;
      });
    };
    window.addEventListener("codevents:build", toggle);
    return () => window.removeEventListener("codevents:build", toggle);
  }, []);

  const dismissTip = () => {
    setTip(false);
    try {
      localStorage.setItem("codevents:build:tip", "1");
    } catch {}
  };

  // ---- geometry ----
  const yOf = useCallback((b: Block, list: Block[], depth = 0): number => {
    const floor = document.documentElement.scrollHeight - SIZE;
    if (depth > 200 || b.anchor.kind === "floor") return floor;
    if (b.anchor.kind === "el") return b.anchor.el.isConnected ? docTop(b.anchor.el) + b.anchor.dy : floor;
    const anchorId = b.anchor.id;
    const parent = list.find((p) => p.id === anchorId);
    return parent ? yOf(parent, list, depth + 1) - SIZE : floor;
  }, []);
  const xOf = useCallback((b: Block, list: Block[] = blocksRef.current, depth = 0): number => {
    if (b.anchor.kind === "el" && b.anchor.el.isConnected) return docLeft(b.anchor.el) + b.anchor.dx;
    if (b.anchor.kind === "block" && depth < 200) {
      const anchorId = b.anchor.id;
      const parent = list.find((p) => p.id === anchorId);
      if (parent) return xOf(parent, list, depth + 1);
    }
    return b.x;
  }, []);

  // ---- load / save per page ----
  useEffect(() => {
    let saved: Saved[] = [];
    try {
      saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {}
    setBlocks([]);
    const t = setTimeout(() => {
      setBlocks(
        saved.map((s) => {
          if (s.anchor.kind === "el") {
            const el = document.querySelector(s.anchor.path);
            return { id: s.id, x: s.x, type: s.type, anchor: el ? { kind: "el", el, dx: s.anchor.dx, dy: s.anchor.dy } : { kind: "floor" } };
          }
          return { id: s.id, x: s.x, type: s.type, anchor: s.anchor };
        })
      );
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
    const id = window.setInterval(bump, 1000);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", bump);
      clearInterval(id);
    };
  }, []);

  const blockAt = useCallback(
    (px: number, py: number) =>
      blocksRef.current.find((b) => {
        const bx = xOf(b);
        const by = yOf(b, blocksRef.current);
        return px >= bx && px < bx + SIZE && py >= by && py < by + SIZE;
      }),
    [xOf, yOf]
  );

  const resolveLanding = useCallback(
    (px: number, py: number): { x: number; y: number; anchor: Anchor } => {
      const x = Math.floor(px / SIZE) * SIZE;
      const cx = x + SIZE / 2;
      let bestTop = document.documentElement.scrollHeight;
      let anchor: Anchor = { kind: "floor" };
      for (const b of blocksRef.current) {
        if (Math.abs(xOf(b) - x) > SIZE / 2) continue;
        const top = yOf(b, blocksRef.current);
        if (top >= py - SIZE / 2 && top < bestTop) {
          bestTop = top;
          anchor = { kind: "block", id: b.id };
        }
      }
      document.querySelectorAll(SOLID).forEach((el) => {
        const h = el as HTMLElement;
        if (h.closest("[data-build-ui], header, [aria-label='CODES terminal']")) return;
        if (h.closest(".fixed") || getComputedStyle(h).position === "fixed") return;
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

  const drop = useCallback(
    (px: number, py: number) => {
      const hit = blockAt(px, py);
      const land = hit
        ? { x: xOf(hit), y: yOf(hit, blocksRef.current) - SIZE, anchor: { kind: "block", id: hit.id } as Anchor }
        : resolveLanding(px, py);
      if (land.y < 0) return;
      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      setBlocks((bs) => {
        let next = [...bs, { id, x: land.x, type: typeRef.current, anchor: land.anchor }];
        // cap: drop the oldest block that nothing rests on
        while (next.length > MAX_BLOCKS) {
          const restedOn = new Set(next.map((b) => (b.anchor.kind === "block" ? b.anchor.id : "")));
          const victim = next.find((b) => !restedOn.has(b.id)) ?? next[0];
          next = next.filter((b) => b.id !== victim.id);
        }
        return next;
      });
      const fell = Math.max(0, land.y - (py - SIZE / 2));
      setFalling((f) => ({ ...f, [id]: fell }));
      setTimeout(
        () =>
          setFalling((f) => {
            const { [id]: _, ...rest } = f; // eslint-disable-line @typescript-eslint/no-unused-vars
            return rest;
          }),
        320
      );
    },
    [blockAt, resolveLanding, xOf, yOf]
  );

  const breakBlock = useCallback(
    (target: Block) => {
      const tx = xOf(target);
      setBlocks((bs) =>
        bs
          .filter((b) => b.id !== target.id)
          .map((b) => (b.anchor.kind === "block" && b.anchor.id === target.id ? { ...b, anchor: target.anchor, x: tx } : b))
      );
    },
    [xOf]
  );

  // ---- the always-on part: listen to normal clicks on the page ----
  useEffect(() => {
    if (!enabled) return;
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (!t || t.closest(INTERACTIVE)) return;
      if (window.getSelection()?.toString()) return; // they were selecting text
      if (document.querySelector("[aria-label='CODES terminal']")) return;
      const px = e.clientX + window.scrollX;
      const py = e.clientY + window.scrollY;
      const hit = blockAt(px, py);
      if (e.shiftKey && hit) return breakBlock(hit);
      if (e.shiftKey) return;
      drop(px, py);
      setTip(false);
    };
    const onContext = (e: MouseEvent) => {
      const hit = blockAt(e.clientX + window.scrollX, e.clientY + window.scrollY);
      if (!hit) return; // normal right-click everywhere else
      e.preventDefault();
      breakBlock(hit);
    };
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      if (document.querySelector("[aria-label='CODES terminal']")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= TYPES.length) setType(TYPES[n - 1].id);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("contextmenu", onContext);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("contextmenu", onContext);
      window.removeEventListener("keydown", onKey);
    };
  }, [enabled, blockAt, breakBlock, drop]);

  return (
    <>
      {/* block layer, in document coordinates */}
      <div aria-hidden className="pointer-events-none absolute left-0 top-0 z-[55] h-0 w-full" data-build-ui>
        {blocks.map((b) => {
          const t = TYPES.find((x) => x.id === b.type) ?? TYPES[0];
          const fell = falling[b.id];
          return (
            <span
              key={b.id}
              className={cn("absolute rounded-[5px]", t.cls, fell ? "animate-[blockfall_0.3s_cubic-bezier(.5,0,.75,0)]" : "")}
              style={{ left: xOf(b, blocks), top: yOf(b, blocks), width: SIZE, height: SIZE, ["--fall" as string]: `${-(fell ?? 0)}px` }}
            />
          );
        })}
      </div>

      {/* corner palette */}
      <div data-build-ui className="no-print fixed bottom-4 left-4 z-[57] hidden items-center gap-1 rounded-xl border border-white/10 bg-black/75 p-1.5 shadow-xl backdrop-blur [@media(pointer:fine)]:flex">
        {enabled ? (
          <>
            {TYPES.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                title={`${i + 1} · ${t.label}`}
                aria-label={`Block colour: ${t.label}`}
                className={cn("size-6 rounded-md p-1 transition-all", type === t.id ? "bg-white/15 ring-1 ring-white/60" : "hover:bg-white/10")}
              >
                <span className={cn("block size-full rounded-[3px]", t.cls)} />
              </button>
            ))}
            <span className="px-1.5 font-mono text-[10px] tabular-nums text-neutral-500">{blocks.length}</span>
            {blocks.length > 0 && (
              <button onClick={() => setBlocks([])} className="rounded px-1.5 py-0.5 font-mono text-[10px] text-neutral-500 hover:text-red-300">
                clear
              </button>
            )}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("codevents:build", { detail: { on: false } }))}
              className="rounded px-1.5 py-0.5 font-mono text-[10px] text-neutral-500 hover:text-neutral-200"
              title="Turn building off"
            >
              off
            </button>
          </>
        ) : (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("codevents:build", { detail: { on: true } }))}
            className="flex items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-[10px] text-neutral-500 hover:text-neutral-200"
          >
            <span className="size-2.5 rounded-[2px] bg-[#2a4aff]" /> build
          </button>
        )}
      </div>

      {enabled && tip && (
        <div data-build-ui className="no-print fixed bottom-16 left-4 z-[57] hidden max-w-[260px] rounded-lg border border-white/10 bg-black/85 px-3 py-2 font-mono text-[11px] text-neutral-300 shadow-xl backdrop-blur [@media(pointer:fine)]:block">
          psst: click any empty space to drop a block. right-click one to break it.
          <button onClick={dismissTip} className="ml-2 text-neutral-500 hover:text-white">
            got it
          </button>
        </div>
      )}
    </>
  );
}
