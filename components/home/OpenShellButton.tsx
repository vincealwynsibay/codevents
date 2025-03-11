"use client";

export default function OpenShellButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("codevents:terminal"))}
      className="rounded-md border border-white/15 px-3 py-2.5 text-xs text-neutral-300 transition-colors hover:border-blue-400/60 hover:text-white"
    >
      open shell <kbd className="ml-1 rounded border border-white/15 px-1 text-[11px]">`</kbd>
    </button>
  );
}
