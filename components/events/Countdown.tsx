"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export default function Countdown({ to, label }: { to: string; label?: string }) {
  // Start null so server and client render the same markup, then tick on the client.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const p = parts(now === null ? 0 : new Date(to).getTime() - now);
  const cells: [string, number][] = [
    ["days", p.days],
    ["hrs", p.hours],
    ["min", p.minutes],
    ["sec", p.seconds],
  ];
  return (
    <div>
      {label && <p className="eyebrow mb-2">{label}</p>}
      <div className="flex gap-2" aria-live="off">
        {cells.map(([unit, value]) => (
          <div
            key={unit}
            className="relative min-w-[64px] overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b from-white/[0.07] to-black/40 px-3 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            <div className="scanlines pointer-events-none absolute inset-0 opacity-40" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-black/50" />
            <div className="relative font-chakra text-2xl font-bold tabular-nums [text-shadow:0_0_18px_rgba(120,140,255,0.55)] sm:text-3xl">
              {now === null ? "--" : String(value).padStart(2, "0")}
            </div>
            <div className="relative text-[10px] uppercase tracking-widest text-muted-foreground">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
