import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-2xl place-items-center px-4">
      <div className="w-full">
        <p className="highlight text-center font-chakra text-8xl font-bold">404</p>
        <div className="mt-10 overflow-hidden rounded-xl border border-white/10 bg-black/60 font-mono text-[13px] shadow-[0_20px_50px_-25px_rgba(42,74,255,0.7)]">
          <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.03] px-3 py-2">
            <span className="size-2.5 rounded-full bg-red-500/70" />
            <span className="size-2.5 rounded-full bg-amber-400/70" />
            <span className="size-2.5 rounded-full bg-emerald-400/70" />
            <span className="ml-2 text-[11px] text-neutral-500">~/codes — zsh</span>
          </div>
          <div className="scanlines space-y-1 px-4 py-4 leading-relaxed">
            <p>
              <span className="text-emerald-300">codes@umtc</span>
              <span className="text-neutral-500">:~$ </span>
              <span className="text-neutral-100">cd ./this-page</span>
            </p>
            <p className="text-red-400">zsh: no such file or directory: ./this-page</p>
            <p className="text-neutral-500"># it doesn&apos;t exist, moved, or isn&apos;t public yet.</p>
            <p className="text-neutral-500"># hint: press ` and type `ls` to see what does exist.</p>
            <p>
              <span className="text-emerald-300">codes@umtc</span>
              <span className="text-neutral-500">:~$ </span>
              <span className="blink text-blue-300">▍</span>
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link href="/events">cd /events</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">cd ~</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
