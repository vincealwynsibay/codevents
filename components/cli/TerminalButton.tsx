"use client";

import { SquareTerminal } from "lucide-react";

export default function TerminalButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("codevents:terminal"))}
      className="group hidden items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground sm:flex"
      aria-label="Open terminal"
      title="Open terminal (` or Ctrl+K)"
    >
      <SquareTerminal className="size-3.5 text-blue-300" />
      <span>terminal</span>
      <kbd className="rounded border border-white/15 bg-black/40 px-1 text-[10px]">`</kbd>
    </button>
  );
}
