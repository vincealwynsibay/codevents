"use client";

import { useEffect, useRef, useState } from "react";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const BUG_COUNT = 12;

type Bug = { id: number; x: number; y: number; angle: number; speed: number; squashed: boolean };

function readSquashed() {
  try {
    return Number(localStorage.getItem("codevents:squashed") || 0);
  } catch {
    return 0;
  }
}

/**
 * Site-wide easter eggs:
 * - DevTools console banner
 * - Konami code, `debug` in the terminal, or 5 quick clicks on the logo → bug swarm
 */
export default function EasterEggs() {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const raf = useRef<number | null>(null);

  // Console banner for the curious.
  useEffect(() => {
    const art = [
      "%c",
      "   ___ ___  ___  ___ ___ ",
      "  / __/ _ \\|   \\| __/ __|",
      " | (_| (_) | |) | _|\\__ \\",
      "  \\___\\___/|___/|___|___/",
      "",
    ].join("\n");
    console.log(art, "color:#6b8cff;font-family:monospace;font-weight:bold");
    console.log(
      "%cPoking around? You'd fit right in. Press ` for the terminal, or try the Konami code. 🐞",
      "color:#9aa4b2;font-size:12px"
    );
  }, []);

  useEffect(() => {
    setTotal(readSquashed());
    let seq: string[] = [];
    const clicks: number[] = [];

    const release = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setBugs(
        Array.from({ length: BUG_COUNT }, (_, i) => ({
          id: Date.now() + i,
          x: Math.random() * (w - 40),
          y: Math.random() * (h - 40),
          angle: Math.random() * Math.PI * 2,
          speed: 0.6 + Math.random() * 1.4,
          squashed: false,
        }))
      );
      setToast("🐞 Bugs got into production! Click to squash them.");
    };

    const onKey = (e: KeyboardEvent) => {
      seq = [...seq, e.key.length === 1 ? e.key.toLowerCase() : e.key].slice(-KONAMI.length);
      if (seq.join() === KONAMI.join()) {
        seq = [];
        release();
      }
    };
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest("[data-egg='logo']");
      if (!el) return;
      const now = Date.now();
      clicks.push(now);
      while (clicks.length && now - clicks[0] > 2000) clicks.shift();
      if (clicks.length >= 5) {
        clicks.length = 0;
        e.preventDefault();
        release();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick, true);
    window.addEventListener("codevents:bugs", release);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("codevents:bugs", release);
    };
  }, []);

  // Wander around.
  useEffect(() => {
    if (bugs.length === 0) return;
    const step = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setBugs((prev) =>
        prev.map((b) => {
          if (b.squashed) return b;
          let angle = b.angle + (Math.random() - 0.5) * 0.4;
          let x = b.x + Math.cos(angle) * b.speed;
          let y = b.y + Math.sin(angle) * b.speed;
          if (x < 0 || x > w - 32) angle = Math.PI - angle;
          if (y < 0 || y > h - 32) angle = -angle;
          x = Math.min(Math.max(0, x), w - 32);
          y = Math.min(Math.max(0, y), h - 32);
          return { ...b, x, y, angle };
        })
      );
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [bugs.length]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  function squash(id: number) {
    setBugs((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, squashed: true } : b));
      const left = next.filter((b) => !b.squashed).length;
      const newTotal = readSquashed() + 1;
      try {
        localStorage.setItem("codevents:squashed", String(newTotal));
      } catch {}
      setTotal(newTotal);
      if (left === 0) {
        setToast(`✅ All bugs fixed. Ship it! (lifetime squashed: ${newTotal})`);
        setTimeout(() => setBugs([]), 1200);
      }
      return next;
    });
  }

  const alive = bugs.filter((b) => !b.squashed).length;

  return (
    <>
      {bugs.map((b) => (
        <button
          key={b.id}
          aria-label="Squash bug"
          onClick={() => squash(b.id)}
          disabled={b.squashed}
          className="fixed z-[65] size-8 select-none transition-transform"
          style={{
            left: b.x,
            top: b.y,
            transform: `rotate(${b.angle + Math.PI / 2}rad) scale(${b.squashed ? 1.3 : 1})`,
          }}
        >
          {b.squashed ? (
            <svg viewBox="0 0 32 32" className="size-8">
              <path d="M16 4l3 7 8-2-5 6 6 5-8 0-2 8-3-7-6 4 2-8-7-3 7-3-2-7z" fill="#22c55e" fillOpacity="0.7" />
            </svg>
          ) : (
            <svg viewBox="0 0 32 32" className="size-8 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]">
              <g stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round">
                <path d="M10 12l-5-3M10 17H4M10 22l-5 3M22 12l5-3M22 17h6M22 22l5 3M13 6l-2-3M19 6l2-3" />
              </g>
              <ellipse cx="16" cy="18" rx="7" ry="9" fill="#ef4444" />
              <circle cx="16" cy="8" r="4" fill="#1f2937" />
              <path d="M16 9v18" stroke="#7f1d1d" strokeWidth="1.2" />
              <circle cx="13" cy="15" r="1.5" fill="#1f2937" />
              <circle cx="19" cy="20" r="1.5" fill="#1f2937" />
              <circle cx="13" cy="22" r="1.2" fill="#1f2937" />
            </svg>
          )}
        </button>
      ))}

      {(alive > 0 || toast) && (
        <div className="fixed left-1/2 top-20 z-[66] -translate-x-1/2 rounded-full border border-white/10 bg-black/85 px-4 py-2 font-mono text-xs text-neutral-200 shadow-xl backdrop-blur">
          {toast ?? `🐞 ${alive} bug${alive === 1 ? "" : "s"} left · squashed all-time: ${total}`}
        </div>
      )}
    </>
  );
}
