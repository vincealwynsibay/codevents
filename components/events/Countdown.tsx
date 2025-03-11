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
          <div key={unit} className="min-w-[64px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-center">
            <div className="font-chakra text-2xl font-bold tabular-nums sm:text-3xl">
              {now === null ? "--" : String(value).padStart(2, "0")}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
