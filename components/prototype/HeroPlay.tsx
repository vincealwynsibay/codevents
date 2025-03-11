"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/*
  A+B: the hero is one terminal window. The top pane is a mini shell, the bottom
  pane is a tiny platformer where every door is a folder. Walking to a door
  ghost-types `cd <path>`; typing `cd 2` walks Debuggy there. Same world, two controls.
*/

export type Door = {
  path: string; // "events/codes-hackathon-2026"
  label: string; // sign text
  href: string | null; // null = opens the full terminal
  icon: string;
  tone: "event" | "past" | "me" | "shell";
};

type Bug = { id: number; x: number; dir: 1 | -1; dead: boolean; deadAt?: number };
type ShellLine = { text: string; tone: "cmd" | "out" | "dim" | "ok" | "warn" | "ghost" };

const GROUND = 28; // px from stage bottom
const SPEED = 3.4;
const GRAVITY = 0.62;
const JUMP_V = 11;
const HERO_W = 46;
const HERO_H = 72;

const TONE: Record<ShellLine["tone"], string> = {
  cmd: "text-neutral-100",
  out: "text-neutral-300",
  dim: "text-neutral-500",
  ok: "text-emerald-300",
  warn: "text-amber-300",
  ghost: "text-neutral-500 italic",
};

export default function HeroPlay({ doors, pixelFont }: { doors: Door[]; pixelFont: string }) {
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [width, setWidth] = useState(900);
  const [active, setActive] = useState(false); // stage in view → arrow keys belong to the game

  // render state (physics lives in refs, React only paints)
  const [hero, setHero] = useState({ x: 60, y: 0, facing: 1 as 1 | -1, moving: false, hurt: false });
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [near, setNear] = useState<number | null>(null);
  const [entering, setEntering] = useState<number | null>(null);
  const [squashed, setSquashed] = useState(0);
  const [lines, setLines] = useState<ShellLine[]>([
    { text: "codevents world loaded. every door is a folder.", tone: "dim" },
    { text: "← → move · space jump · ↑ / enter go in · or type `ls`, `cd 2`", tone: "dim" },
  ]);
  const [input, setInput] = useState("");

  const phys = useRef({ x: 60, y: 0, vx: 0, vy: 0, facing: 1 as 1 | -1, hurtUntil: 0 });
  const keys = useRef<Record<string, boolean>>({});
  const bugsRef = useRef<Bug[]>([]);
  const autoTarget = useRef<{ door: number; enter: boolean } | null>(null);
  const nearRef = useRef<number | null>(null);
  const enteringRef = useRef<number | null>(null);

  const doorX = useCallback(
    (i: number) => {
      const left = 150;
      const right = width - 70;
      return doors.length === 1 ? (left + right) / 2 : left + ((right - left) * i) / (doors.length - 1);
    },
    [doors.length, width]
  );

  const print = (...ls: ShellLine[]) => setLines((prev) => [...prev.filter((l) => l.tone !== "ghost"), ...ls].slice(-7));

  // ---- size + visibility ----
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting && e.intersectionRatio > 0.6), { threshold: [0, 0.6, 1] });
    io.observe(el);
    try {
      setSquashed(Number(localStorage.getItem("codevents:squashed") || 0));
    } catch {}
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  // ---- bugs patrol the gaps between doors ----
  useEffect(() => {
    const initial: Bug[] = [0, 1, 2].map((i) => ({
      id: i,
      x: 120 + Math.random() * Math.max(200, width - 240),
      dir: Math.random() > 0.5 ? 1 : -1,
      dead: false,
    }));
    bugsRef.current = initial;
    setBugs(initial);
  }, [width]);

  // ---- enter a door ----
  const enter = useCallback(
    (i: number) => {
      if (enteringRef.current !== null) return;
      const d = doors[i];
      enteringRef.current = i;
      setEntering(i);
      print({ text: `codes@umtc:~$ cd ~/${d.path}`, tone: "cmd" }, { text: d.href ? `→ opening ${d.label}…` : "→ opening the full shell…", tone: "ok" });
      setTimeout(() => {
        if (d.href) router.push(d.href);
        else window.dispatchEvent(new CustomEvent("codevents:terminal", { detail: { tty: false } }));
        enteringRef.current = null;
        setEntering(null);
      }, 650);
    },
    [doors, router]
  );

  // ---- keyboard ----
  useEffect(() => {
    const typing = (el: EventTarget | null) =>
      el instanceof HTMLElement && el !== inputRef.current && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
    const down = (e: KeyboardEvent) => {
      if (typing(e.target) || document.querySelector('[aria-label="CODES terminal"]')) return;
      const inMini = e.target === inputRef.current;
      const k = e.key;
      const gameKey = ["ArrowLeft", "ArrowRight", "ArrowUp", " ", "a", "d", "w", "A", "D", "W"].includes(k);
      if (!active && !inMini) return;
      if (inMini && !["ArrowLeft", "ArrowRight", "ArrowUp"].includes(k)) return; // let the mini shell type
      if (inMini && input.length > 0) return; // arrows edit text when there's text
      if (gameKey || (k === "Enter" && !inMini)) e.preventDefault();
      if (k === "Enter" && !inMini && nearRef.current !== null) enter(nearRef.current);
      if ((k === "ArrowUp" || k === "w" || k === "W") && nearRef.current !== null) enter(nearRef.current);
      if (k === " " && phys.current.y === 0) phys.current.vy = JUMP_V;
      keys.current[k.toLowerCase()] = true;
      autoTarget.current = gameKey ? null : autoTarget.current;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [active, enter, input]);

  // ---- game loop ----
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = phys.current;
      const now = performance.now();
      const left = keys.current["arrowleft"] || keys.current["a"];
      const right = keys.current["arrowright"] || keys.current["d"];
      let vx = 0;
      if (now < p.hurtUntil) vx = p.vx * 0.9;
      else if (autoTarget.current) {
        const tx = doorX(autoTarget.current.door);
        const dx = tx - p.x;
        if (Math.abs(dx) < SPEED + 1) {
          p.x = tx;
          const t = autoTarget.current;
          autoTarget.current = null;
          if (t.enter) enter(t.door);
        } else vx = Math.sign(dx) * SPEED;
      } else vx = (right ? SPEED : 0) - (left ? SPEED : 0);
      p.vx = vx;
      if (vx !== 0) p.facing = vx > 0 ? 1 : -1;
      p.x = Math.min(Math.max(HERO_W / 2, p.x + vx), width - HERO_W / 2);
      p.vy -= GRAVITY;
      p.y = Math.max(0, p.y + p.vy);
      if (p.y === 0) p.vy = 0;

      // bugs
      const bs = bugsRef.current;
      let changed = false;
      for (const b of bs) {
        if (b.dead) {
          if (b.deadAt && now - b.deadAt > 2500) {
            b.dead = false;
            b.deadAt = undefined;
            b.x = Math.random() < 0.5 ? 40 : width - 40;
            changed = true;
          }
          continue;
        }
        b.x += b.dir * 0.9;
        if (b.x < 30 || b.x > width - 30) b.dir = (b.dir * -1) as 1 | -1;
        changed = true;
        const dx = Math.abs(b.x - p.x);
        if (dx < 26 && p.y > 0 && p.y < 34 && p.vy < 0) {
          b.dead = true;
          b.deadAt = now;
          p.vy = 8;
          try {
            const n = Number(localStorage.getItem("codevents:squashed") || 0) + 1;
            localStorage.setItem("codevents:squashed", String(n));
            setSquashed(n);
          } catch {
            setSquashed((s) => s + 1);
          }
        } else if (dx < 22 && p.y < 6 && now > p.hurtUntil) {
          p.hurtUntil = now + 450;
          p.vx = (p.x < b.x ? -1 : 1) * 6;
          p.vy = 5;
        }
      }
      if (changed) setBugs(bs.map((b) => ({ ...b })));

      // nearest door
      let n: number | null = null;
      doors.forEach((_, i) => {
        if (Math.abs(doorX(i) - p.x) < 34) n = i;
      });
      if (n !== nearRef.current) {
        nearRef.current = n;
        setNear(n);
        if (n !== null) {
          const d = doors[n];
          setLines((prev) => [...prev.filter((l) => l.tone !== "ghost"), { text: `codes@umtc:~$ cd ~/${d.path}   ← ↑/enter`, tone: "ghost" as const }].slice(-7));
        } else setLines((prev) => prev.filter((l) => l.tone !== "ghost"));
      }

      setHero({ x: p.x, y: p.y, facing: p.facing, moving: vx !== 0 && p.y === 0, hurt: now < p.hurtUntil });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [doorX, doors, enter, width]);

  // ---- mini shell ----
  function runMini(raw: string) {
    const cmd = raw.trim();
    if (!cmd) return;
    print({ text: `codes@umtc:~$ ${cmd}`, tone: "cmd" });
    const [c, ...rest] = cmd.split(/\s+/);
    const arg = rest.join(" ");
    switch (c) {
      case "help":
        print({ text: "ls · cd <#|name> · jump · clear · or press ` for the full shell", tone: "out" });
        break;
      case "ls":
        doors.forEach((d, i) => print({ text: `${i + 1}  ${d.path}/`, tone: "out" }));
        break;
      case "cd": {
        const i = Number(arg) - 1;
        const idx = Number.isInteger(i) && i >= 0 && i < doors.length ? i : doors.findIndex((d) => d.path.includes(arg.replace(/^~\//, "")) && arg);
        if (idx < 0) {
          print({ text: `cd: no such door: ${arg || "(nothing)"}`, tone: "warn" });
          break;
        }
        print({ text: `walking to ${doors[idx].path}…`, tone: "dim" });
        autoTarget.current = { door: idx, enter: true };
        break;
      }
      case "jump":
        if (phys.current.y === 0) phys.current.vy = JUMP_V;
        break;
      case "clear":
        setLines([]);
        break;
      default:
        print({ text: `${c}: not in this world. press \` for the full shell.`, tone: "warn" });
    }
  }

  const press = (k: string, v: boolean) => {
    keys.current[k] = v;
    if (v) autoTarget.current = null;
  };

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/70 font-mono shadow-[0_40px_100px_-30px_rgba(42,74,255,0.75)] backdrop-blur">
        {/* chrome */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <span className="size-3 rounded-full bg-red-500/80" />
          <span className="size-3 rounded-full bg-amber-400/80" />
          <span className="size-3 rounded-full bg-emerald-400/80" />
          <span className="ml-3 flex-1 truncate text-xs text-neutral-500">codes@umtc: ~ — codevents (world)</span>
          <span className="text-[11px] text-neutral-500">🐞 squashed: {squashed}</span>
        </div>

        {/* top pane: banner + mini shell */}
        <div className="scanlines grid gap-6 border-b border-dashed border-white/10 p-5 sm:p-7 md:grid-cols-[1fr_1.1fr]">
          <div>
            <pre className="text-[8px] leading-[1.15] text-blue-300 sm:text-[10px]">{String.raw`  ____ ___  ____  _____     _______ _   _ _____ ____
 / ___/ _ \|  _ \| ____\ \   / / ____| \ | |_   _/ ___|
| |  | | | | | | |  _|  \ \ / /|  _| |  \| | | | \___ \
| |__| |_| | |_| | |___  \ V / | |___| |\  | | |  ___) |
 \____\___/|____/|_____|  \_/  |_____|_| \_| |_| |____/`}</pre>
            <p className="mt-4 text-sm text-neutral-300">
              hackathons, talks &amp; workshops by the Computer Debugger&apos;s Society.
              <br />
              <span className="text-neutral-500">walk in, or type your way in. same thing.</span>
            </p>
          </div>
          <div className="flex min-h-[150px] flex-col justify-end rounded-lg border border-white/10 bg-black/50 p-3 text-[12.5px]" onClick={() => inputRef.current?.focus()}>
            {lines.map((l, i) => (
              <div key={i} className={cn("truncate", TONE[l.tone])}>
                {l.text}
              </div>
            ))}
            <div className="flex items-center gap-1">
              <span className="text-emerald-300">codes@umtc</span>
              <span className="text-neutral-500">:~$</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    runMini(input);
                    setInput("");
                  }
                }}
                placeholder="ls"
                spellCheck={false}
                autoCapitalize="off"
                aria-label="World shell"
                className="min-w-0 flex-1 bg-transparent text-neutral-100 caret-blue-400 outline-none placeholder:text-neutral-700"
              />
            </div>
          </div>
        </div>

        {/* bottom pane: the world */}
        <div
          ref={stageRef}
          tabIndex={0}
          aria-label="Game: walk Debuggy to a door to open that page"
          className={cn("relative h-[260px] overflow-hidden outline-none", pixelFont)}
          style={{
            background:
              "radial-gradient(1px 1px at 20px 30px,#fff,transparent),radial-gradient(1px 1px at 120px 80px,#9fb0ff,transparent),radial-gradient(2px 2px at 260px 50px,#fff,transparent),linear-gradient(#070816,#0d1033)",
            backgroundSize: "300px 140px,300px 140px,300px 140px,100% 100%",
          }}
        >
          {/* doors */}
          {doors.map((d, i) => {
            const x = doorX(i);
            const isNear = near === i;
            return (
              <div key={d.path} className="absolute" style={{ left: x - 34, bottom: GROUND }}>
                <div
                  className={cn(
                    "mx-auto mb-2 w-max max-w-[150px] -translate-x-[calc(50%-34px)] truncate rounded-sm border-2 bg-black px-1.5 py-1 text-[8px] leading-tight transition-colors",
                    isNear ? "border-amber-300 text-amber-200" : "border-white/30 text-neutral-300"
                  )}
                >
                  {i + 1} {d.label}
                </div>
                <div
                  className={cn(
                    "relative h-[86px] w-[68px] rounded-t-[34px] border-4 transition-all duration-300",
                    d.tone === "event" && "border-[#2a4aff] bg-[#0b1650]",
                    d.tone === "past" && "border-amber-400 bg-[#3a2a06]",
                    d.tone === "me" && "border-emerald-400 bg-[#062a1c]",
                    d.tone === "shell" && "border-neutral-400 bg-[#15171f]",
                    isNear && "shadow-[0_0_24px_rgba(251,191,36,0.55)]",
                    entering === i && "brightness-200"
                  )}
                >
                  <img src={d.icon} alt="" className="absolute left-1/2 top-4 h-8 w-auto -translate-x-1/2 [image-rendering:pixelated]" />
                  <span className="absolute bottom-6 right-2 size-1.5 rounded-full bg-amber-300" />
                  {isNear && <span className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce text-[10px] text-amber-300">▲</span>}
                </div>
              </div>
            );
          })}

          {/* bugs */}
          {bugs.map((b) => (
            <span
              key={b.id}
              className={cn("bug-sprite absolute block size-7 transition-opacity", b.dead && "opacity-0")}
              style={{ left: b.x - 14, bottom: GROUND - 2, transform: `rotate(${b.dir === 1 ? 90 : -90}deg)` }}
            />
          ))}

          {/* Debuggy */}
          <img
            src="/images/sprites/debuggy.png"
            alt="Debuggy"
            className={cn("absolute w-auto [image-rendering:pixelated]", hero.hurt && "animate-pulse")}
            style={{
              height: HERO_H,
              left: hero.x - HERO_W / 2,
              bottom: GROUND + hero.y + (hero.moving ? Math.abs(Math.sin(performance.now() / 70)) * 3 : 0),
              transform: `scaleX(${hero.facing})`,
              filter: hero.hurt ? "drop-shadow(0 0 6px rgba(239,68,68,0.9))" : undefined,
            }}
          />
          {hero.hurt && (
            <span className="absolute text-[9px] text-red-300" style={{ left: hero.x - 16, bottom: GROUND + HERO_H + hero.y + 6 }}>
              OUCH
            </span>
          )}

          {/* ground */}
          <div className="absolute inset-x-0 bottom-0 border-t-4 border-[#5DA144] bg-[repeating-linear-gradient(90deg,#3f2a1a_0_16px,#4a3220_16px_32px)]" style={{ height: GROUND }} />

          {!active && (
            <button
              onClick={() => stageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
              className="absolute left-3 top-3 rounded-sm border-2 border-white/40 bg-black/70 px-2 py-1 text-[8px] text-neutral-300"
            >
              ▶ SCROLL HERE TO PLAY
            </button>
          )}

          {/* touch controls */}
          <div className="absolute right-3 top-3 flex gap-1.5 sm:hidden">
            {[
              ["◀", "arrowleft"],
              ["▶", "arrowright"],
            ].map(([label, k]) => (
              <button
                key={k}
                onPointerDown={() => press(k, true)}
                onPointerUp={() => press(k, false)}
                onPointerLeave={() => press(k, false)}
                className="size-10 rounded-md border-2 border-white/30 bg-black/70 text-sm text-white"
              >
                {label}
              </button>
            ))}
            <button onClick={() => phys.current.y === 0 && (phys.current.vy = JUMP_V)} className="size-10 rounded-md border-2 border-white/30 bg-black/70 text-[9px] text-white">
              JUMP
            </button>
            <button onClick={() => near !== null && enter(near)} className="size-10 rounded-md border-2 border-amber-300/60 bg-black/70 text-sm text-amber-200">
              ⏎
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
