import OpenTerminal from "@/components/cli/OpenTerminal";

export const metadata = { title: "Terminal" };

/** Permalink to the full-screen shell: /terminal */
export default function TerminalPage() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 text-center font-mono text-sm text-muted-foreground">
      <OpenTerminal />
      <p>
        opening the CODES shell… if it didn&apos;t open, press <kbd className="rounded border border-white/15 px-1">`</kbd>.
      </p>
    </div>
  );
}
