"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { clientDb } from "@/lib/client/firestore";
import { breakBlock as breakBlockAction, placeBlock } from "@/lib/actions/builds";
import { cn } from "@/lib/utils";

/*
  Shared build mode (desktop): everyone sees the same blocks on the same page, live.
  - Click empty space or plain text to drop a block. Links, buttons, inputs, cards
    and the shell keep their normal behaviour. Click a block to stack on it.
  - Right-click your own block to break it (officers can break any).
  - Anyone can build: guests get a cookie id (8 blocks/page, fade after 24 h),
    signed-in students get 20 that stay. 3 colours. Limits are server-side.
  - Blocks only land on stable things marked with data-anchor (same for every viewer),
    other blocks, or the bottom of the page.
*/

const SIZE = 26;

const TYPES = [
  { id: "blue", label: "CODES blue", cls: "bg-[#2a4aff] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_14px_-6px_rgba(42,74,255,0.8)]" },
  { id: "glass", label: "Glass", cls: "border border-white/40 bg-white/10 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]" },
  { id: "amber", label: "Amber", cls: "bg-[#fcd34d] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_6px_14px_-6px_rgba(245,158,11,0.8)]" },
] as const;
type TypeId = (typeof TYPES)[number]["id"];

const INTERACTIVE =
  "a, button, input, textarea, select, label, summary, [role=button], [role=dialog], [contenteditable], [data-build-ui], header, [aria-label='CODES terminal'], [aria-label^='Game'], [aria-label^='Block builder']";

type Block = {
  id: string;
  anchor: string;
  dx: number;
  type: TypeId;
  uid: string;
  name: string;
  guest?: boolean;
  createdAt: number;
  expiresAt?: number;
  pending?: boolean;
  // falling-from-the-cursor animation (local placeholder only)
  offX?: number;
  offY?: number;
  fallMs?: number;
  realId?: string;
};

const anchorEl = (name: string) => document.querySelector(`[data-anchor="${CSS.escape(name)}"]`);

export default function BuildMode() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [remote, setRemote] = useState<Block[]>([]);
  const [pending, setPending] = useState<Block[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(new Set()); // optimistic breaks
  const [type, setType] = useState<TypeId>("blue");
  const typeRef = useRef<TypeId>("blue");
  const [, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [tip, setTip] = useState(false);
  typeRef.current = type;

  // while a placeholder is still falling, hide the real block it turned into (no jump)
  const takenOver = new Set(pending.map((b) => b.realId).filter(Boolean) as string[]);
  const blocks = [...remote.filter((b) => !hidden.has(b.id) && !takenOver.has(b.id)), ...pending];
  const blocksRef = useRef<Block[]>(blocks);
  blocksRef.current = blocks;

  const say = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 3200);
  };

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

  // ---- live blocks for this page (visible even when building is off) ----
  useEffect(() => {
    setRemote([]);
    setPending([]);
    setHidden(new Set());
    const q = query(collection(clientDb, "buildBlocks"), where("page", "==", pathname));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const now = Date.now();
        // guest blocks expire after 24 h (the server sweeps them on the next placement)
        setRemote(
          snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<Block, "id">) }))
            .filter((b) => !b.expiresAt || b.expiresAt > now)
        );
      },
      (err) => console.warn("[build] live updates unavailable:", err.message)
    );
    return unsub;
  }, [pathname]);

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

  // ---- geometry (document coordinates) ----
  const posOf = useCallback((b: Block, list: Block[], depth = 0): { x: number; y: number } | null => {
    const floorY = document.documentElement.scrollHeight - SIZE;
    if (depth > 200) return null;
    if (b.anchor === "floor") return { x: b.dx, y: floorY };
    if (b.anchor.startsWith("block:")) {
      const parentId = b.anchor.slice(6);
      const parent = list.find((p) => p.id === parentId);
      if (!parent) return null;
      const p = posOf(parent, list, depth + 1);
      return p ? { x: p.x, y: p.y - SIZE } : null;
    }
    const el = anchorEl(b.anchor);
    if (!el) return null; // anchor not on screen for this viewer: hide the block
    const r = el.getBoundingClientRect();
    const dx = Math.min(Math.max(0, b.dx), Math.max(0, r.width - SIZE));
    return { x: r.left + window.scrollX + dx, y: r.top + window.scrollY - SIZE };
  }, []);

  const blockAtPoint = useCallback(
    (px: number, py: number) =>
      blocksRef.current.find((b) => {
        const p = posOf(b, blocksRef.current);
        return p && px >= p.x && px < p.x + SIZE && py >= p.y && py < p.y + SIZE;
      }),
    [posOf]
  );

  /** Where a drop at (px, py) lands: on a block in that column, a data-anchor element, or the floor. */
  const resolveLanding = useCallback(
    (px: number, py: number): { anchor: string; dx: number; x: number; y: number } => {
      let best = { anchor: "floor", dx: Math.floor(px / SIZE) * SIZE, x: Math.floor(px / SIZE) * SIZE, y: document.documentElement.scrollHeight - SIZE };
      let bestTop = document.documentElement.scrollHeight;
      for (const b of blocksRef.current) {
        if (b.pending) continue;
        const p = posOf(b, blocksRef.current);
        if (!p || px < p.x || px >= p.x + SIZE) continue;
        if (p.y >= py - SIZE / 2 && p.y < bestTop) {
          bestTop = p.y;
          best = { anchor: `block:${b.id}`, dx: 0, x: p.x, y: p.y - SIZE };
        }
      }
      document.querySelectorAll("[data-anchor]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width < SIZE) return;
        const left = r.left + window.scrollX;
        const top = r.top + window.scrollY;
        if (px < left || px > left + r.width) return;
        if (top >= py - SIZE / 2 && top < bestTop) {
          bestTop = top;
          const dx = Math.min(Math.floor((px - left) / SIZE) * SIZE, Math.max(0, Math.floor((r.width - SIZE) / SIZE) * SIZE));
          best = { anchor: el.getAttribute("data-anchor")!, dx, x: left + dx, y: top - SIZE };
        }
      });
      return best;
    },
    [posOf]
  );

  const drop = useCallback(
    async (land: { anchor: string; dx: number }, from: { x: number; y: number }) => {
      const tempId = `tmp${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
      const started = Date.now();
      const draft: Block = { id: tempId, anchor: land.anchor, dx: land.dx, type: typeRef.current, uid: "", name: "you", createdAt: started, pending: true };
      // start centred on the cursor, fall to where it lands; longer drops take longer (gravity)
      const to = posOf(draft, blocksRef.current);
      if (to) {
        draft.offX = from.x - SIZE / 2 - to.x;
        draft.offY = from.y - SIZE / 2 - to.y;
        const dist = Math.hypot(draft.offX, draft.offY);
        draft.fallMs = Math.round(Math.min(900, Math.max(160, Math.sqrt(dist) * 32)));
      }
      setPending((p) => [...p, draft]);
      const res = await placeBlock({ page: pathname, anchor: land.anchor, dx: land.dx, type: typeRef.current });
      if (!res.ok) {
        setPending((p) => p.filter((b) => b.id !== tempId));
        say(res.error);
        return;
      }
      // hand over to the real block once the fall has finished
      const realId = res.data?.id;
      setPending((p) => p.map((b) => (b.id === tempId ? { ...b, realId } : b)));
      const remaining = Math.max(0, (draft.fallMs ?? 0) - (Date.now() - started)) + 80;
      setTimeout(() => setPending((p) => p.filter((b) => b.id !== tempId)), remaining);
    },
    [pathname, posOf]
  );

  const breakOne = useCallback(async (b: Block) => {
    if (b.pending) return;
    setHidden((h) => new Set(h).add(b.id));
    const res = await breakBlockAction(b.id);
    if (!res.ok) {
      setHidden((h) => {
        const n = new Set(h);
        n.delete(b.id);
        return n;
      });
      say(res.error);
    }
  }, []);

  // ---- normal clicks on the page ----
  useEffect(() => {
    if (!enabled) return;
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (document.querySelector("[aria-label='CODES terminal']")) return;
      const px = e.clientX + window.scrollX;
      const py = e.clientY + window.scrollY;
      const onBlock = t.closest("[data-block-id]");
      if (onBlock) {
        const b = blocksRef.current.find((x) => x.id === onBlock.getAttribute("data-block-id"));
        if (!b) return;
        if (e.shiftKey) return void breakOne(b);
        if (!b.pending) void drop({ anchor: `block:${b.id}`, dx: 0 }, { x: px, y: py });
        setTip(false);
        return;
      }
      if (t.closest(INTERACTIVE) || e.shiftKey) return;
      if (window.getSelection()?.toString()) return;
      void drop(resolveLanding(px, py), { x: px, y: py });
      setTip(false);
    };
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      if (document.querySelector("[aria-label='CODES terminal']") || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= TYPES.length) setType(TYPES[n - 1].id);
    };
    document.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [enabled, breakOne, drop, resolveLanding]);

  void blockAtPoint; // kept for future hit-testing (e.g. touch)

  const dismissTip = () => {
    setTip(false);
    try {
      localStorage.setItem("codevents:build:tip", "1");
    } catch {}
  };

  return (
    <>
      {/* block layer, in document coordinates */}
      <div className="pointer-events-none absolute left-0 top-0 z-[55] h-0 w-full" data-build-ui>
        {blocks.map((b) => {
          const p = posOf(b, blocks);
          if (!p) return null;
          const t = TYPES.find((x) => x.id === b.type) ?? TYPES[0];
          return (
            <span
              key={b.id}
              data-block-id={b.id}
              title={b.pending ? "placing…" : b.guest ? "placed by a guest · fades in 24h" : `placed by ${b.name}`}
              onContextMenu={(e) => {
                if (!enabled) return;
                e.preventDefault();
                void breakOne(b);
              }}
              className={cn(
                "absolute rounded-[5px]",
                b.pending ? "build-drop" : "transition-[top,left] duration-200",
                enabled ? "pointer-events-auto cursor-pointer" : "pointer-events-none",
                t.cls
              )}
              style={{
                left: p.x,
                top: p.y,
                width: SIZE,
                height: SIZE,
                ...(b.pending
                  ? {
                      ["--fx" as string]: `${b.offX ?? 0}px`,
                      ["--fy" as string]: `${b.offY ?? -40}px`,
                      animationDuration: `${b.fallMs ?? 300}ms`,
                    }
                  : {}),
              }}
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
            <span className="px-1.5 font-mono text-[10px] tabular-nums text-neutral-500" title="Blocks on this page, from everyone">
              {remote.length} here
            </span>
            <span className="flex items-center gap-1 px-1 font-mono text-[10px] text-emerald-400/80" title="Shared: everyone sees these, live">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> live
            </span>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("codevents:build", { detail: { on: false } }))}
              className="rounded px-1.5 py-0.5 font-mono text-[10px] text-neutral-500 hover:text-neutral-200"
              title="Stop building (you'll still see blocks)"
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

      {enabled && (toast || tip) && (
        <div data-build-ui className="no-print fixed bottom-16 left-4 z-[57] hidden max-w-[280px] rounded-lg border border-white/10 bg-black/85 px-3 py-2 font-mono text-[11px] text-neutral-300 shadow-xl backdrop-blur [@media(pointer:fine)]:block">
          {toast ?? (
            <>
              psst: click any empty space to drop a block. everyone sees them, live. right-click yours to break it. no sign-in needed.
              <button onClick={dismissTip} className="ml-2 text-neutral-500 hover:text-white">
                got it
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
