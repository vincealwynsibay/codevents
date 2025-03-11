"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type HeroRow = { id: string; tag: string; tone: "ok" | "warn" | "accent" | "dim"; date: string; title: string; spots: string };

const TONE = { ok: "text-emerald-300", warn: "text-amber-300", accent: "text-blue-300", dim: "text-neutral-500" };

/** A small terminal that "runs" two commands and prints real upcoming events. */
export default function HeroTerminal({ rows }: { rows: HeroRow[] }) {
  const script = ["whoami", "events --upcoming"];
  const [typed, setTyped] = useState<string[]>(["", ""]);
  const [stage, setStage] = useState(0); // 0: typing cmd1, 1: out1, 2: typing cmd2, 3: rows

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTyped(script);
      setStage(3);
      return;
    }
    let cancelled = false;
    const typeCmd = async (i: number) => {
      for (let c = 1; c <= script[i].length; c++) {
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 45 + Math.random() * 40));
        setTyped((t) => t.map((s, j) => (j === i ? script[i].slice(0, c) : s)));
      }
    };
    (async () => {
      await new Promise((r) => setTimeout(r, 400));
      await typeCmd(0);
      if (cancelled) return;
      setStage(1);
      await new Promise((r) => setTimeout(r, 350));
      setStage(2);
      await typeCmd(1);
      if (cancelled) return;
      await new Promise((r) => setTimeout(r, 200));
      setStage(3);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prompt = (
    <>
      <span className="text-emerald-300">codes</span>
      <span className="text-neutral-500">@</span>
      <span className="text-blue-300">umtc</span>
      <span className="text-neutral-500">:~$ </span>
    </>
  );

  return (
    <div data-solid className="max-w-xl overflow-hidden rounded-xl border border-white/10 bg-black/60 font-mono text-[12.5px] shadow-[0_20px_50px_-25px_rgba(42,74,255,0.7)] backdrop-blur">
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <span className="size-2.5 rounded-full bg-red-500/70" />
        <span className="size-2.5 rounded-full bg-amber-400/70" />
        <span className="size-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-2 text-[11px] text-neutral-500">~/codes — zsh</span>
      </div>
      <div className="scanlines min-h-[180px] space-y-0.5 px-4 py-3 leading-relaxed">
        <div>
          {prompt}
          <span className="text-neutral-100">{typed[0]}</span>
          {stage === 0 && <span className="blink text-blue-300">▍</span>}
        </div>
        {stage >= 1 && (
          <div className="text-neutral-300">
            hackathons, talks &amp; workshops by CODES · UM Tagum College
          </div>
        )}
        {stage >= 2 && (
          <div>
            {prompt}
            <span className="text-neutral-100">{typed[1]}</span>
            {stage === 2 && <span className="blink text-blue-300">▍</span>}
          </div>
        )}
        {stage >= 3 && (
          <>
            {rows.length === 0 ? (
              <div className="text-neutral-500">nothing scheduled yet. check back soon.</div>
            ) : (
              rows.slice(0, 4).map((r, i) => (
                <Link
                  key={r.id}
                  href={`/events/${r.id}`}
                  className="group flex gap-3 whitespace-nowrap rounded px-1 -mx-1 opacity-0 hover:bg-white/5 animate-[fadein_0.3s_forwards]"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <span className={cn("w-16 shrink-0", TONE[r.tone])}>[{r.tag}]</span>
                  <span className="w-12 shrink-0 text-neutral-500">{r.date}</span>
                  <span className="truncate text-neutral-100 group-hover:text-blue-300 group-hover:underline">{r.title}</span>
                  <span className="ml-auto shrink-0 pl-2 text-neutral-500">{r.spots}</span>
                </Link>
              ))
            )}
            <div className="pt-1">
              {prompt}
              <span className="blink text-blue-300">▍</span>
              <button
                onClick={() => window.dispatchEvent(new Event("codevents:terminal"))}
                className="ml-2 text-neutral-500 underline-offset-2 hover:text-neutral-200 hover:underline"
              >
                press <kbd className="rounded border border-white/15 px-1 text-[11px]">`</kbd> for a real shell
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
