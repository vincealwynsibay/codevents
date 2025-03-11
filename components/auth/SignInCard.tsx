"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { signInWithGoogle } from "@/lib/client/signin";

type Status = { tone: "dim" | "ok" | "err"; text: string };

/** The sign-in page, styled as the CODES shell. Enter or click starts Google sign-in. */
export default function SignInCard({ next, domain }: { next: string; domain: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [log, setLog] = useState<Status[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  async function signIn() {
    if (pending) return;
    setPending(true);
    setLog((l) => [...l, { tone: "dim", text: "opening Google sign-in…" }]);
    const res = await signInWithGoogle();
    if (!res.ok) {
      setLog((l) => [...l, { tone: res.cancelled ? "dim" : "err", text: res.cancelled ? "cancelled. press Enter to try again." : `error: ${res.error}` }]);
      setPending(false);
      buttonRef.current?.focus();
      return;
    }
    setLog((l) => [...l, { tone: "ok", text: `✓ signed in. cd ${next}` }]);
    router.replace(next);
    router.refresh();
  }

  const tone = { dim: "text-neutral-500", ok: "text-emerald-300", err: "text-red-400" };
  const prompt = (
    <>
      <span className="text-emerald-300">codes@codevents</span>
      <span className="text-neutral-500">:~$ </span>
    </>
  );

  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-black/60 font-mono text-[13px] shadow-[0_30px_80px_-30px_rgba(42,74,255,0.7)] backdrop-blur">
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <span className="size-2.5 rounded-full bg-red-500/70" />
        <span className="size-2.5 rounded-full bg-amber-400/70" />
        <span className="size-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-2 text-[11px] text-neutral-500">~/codes — login</span>
      </div>
      <div className="scanlines space-y-3 px-5 py-5 leading-relaxed">
        <p>
          {prompt}
          <span className="text-neutral-100">login --provider google</span>
        </p>
        <p className="text-neutral-300">
          sign in with your <span className="text-blue-300">@{domain}</span> Google account to register for events, get your
          QR ticket and download certificates.
        </p>

        <button
          ref={buttonRef}
          onClick={signIn}
          disabled={pending}
          className="group flex w-full items-center justify-between rounded-md border border-blue-400/40 bg-blue-500/10 px-4 py-3 text-left text-neutral-100 outline-none transition-colors hover:bg-blue-500/20 focus-visible:border-blue-300 focus-visible:bg-blue-500/20 disabled:opacity-60"
        >
          <span className="flex items-center gap-3">
            {pending ? <Loader2 className="size-4 animate-spin text-blue-300" /> : <span className="text-blue-300">▶</span>}
            Continue with Google
          </span>
          <kbd className="rounded border border-white/15 bg-black/40 px-1.5 text-[11px] text-neutral-400">⏎ enter</kbd>
        </button>

        {log.map((l, i) => (
          <p key={i} className={tone[l.tone]} role={l.tone === "err" ? "alert" : undefined}>
            {l.text}
          </p>
        ))}

        <div className="space-y-1 border-t border-dashed border-white/10 pt-3 text-neutral-500">
          <p># officers: sign in with the Google account an owner added.</p>
          <p>
            # rather stay in the shell? press{" "}
            <button
              onClick={() => window.dispatchEvent(new Event("codevents:terminal"))}
              className="rounded border border-white/15 px-1 text-neutral-300 hover:text-white"
            >
              `
            </button>{" "}
            and type <span className="text-neutral-300">login</span>.
          </p>
        </div>
        <p>
          {prompt}
          <span className="blink text-blue-300">▍</span>
        </p>
      </div>
    </div>
  );
}
