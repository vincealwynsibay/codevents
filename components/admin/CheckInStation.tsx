"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Camera, CameraOff, CheckCircle2, Loader2, Search, XCircle } from "lucide-react";
import type { IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { checkInByQr, setCheckedIn, CheckInResult } from "@/lib/actions/registrations";
import { formatTime } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/form/fields";
import { cn } from "@/lib/utils";

const Scanner = dynamic(() => import("@yudiel/react-qr-scanner").then((m) => m.Scanner), {
  ssr: false,
  loading: () => <div className="grid aspect-square place-items-center text-sm text-muted-foreground">Starting camera…</div>,
});

type Person = { id: string; name: string; email: string; course: string; checkedInAt: string | null };
type Feedback =
  | { kind: "ok"; data: CheckInResult }
  | { kind: "repeat"; data: CheckInResult }
  | { kind: "error"; message: string };

export default function CheckInStation({ eventId, people }: { eventId: string; people: Person[] }) {
  const router = useRouter();
  const [cameraOn, setCameraOn] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [, start] = useTransition();
  const [localIn, setLocalIn] = useState<Record<string, boolean>>({});
  const lastScan = useRef<{ value: string; at: number } | null>(null);

  const isIn = (p: Person) => localIn[p.id] ?? !!p.checkedInAt;
  const count = people.filter(isIn).length;

  const onScan = useCallback(
    async (codes: IDetectedBarcode[]) => {
      const value = codes[0]?.rawValue;
      if (!value || busy) return;
      // Ignore the same code for a few seconds so one ticket doesn't fire repeatedly.
      const now = Date.now();
      if (lastScan.current && lastScan.current.value === value && now - lastScan.current.at < 4000) return;
      lastScan.current = { value, at: now };
      setBusy(true);
      const res = await checkInByQr(eventId, value);
      setBusy(false);
      if (!res.ok) {
        setFeedback({ kind: "error", message: res.error });
        navigator.vibrate?.([80, 60, 80]);
        return;
      }
      setFeedback({ kind: res.data!.alreadyCheckedIn ? "repeat" : "ok", data: res.data! });
      navigator.vibrate?.(60);
      start(() => router.refresh());
    },
    [busy, eventId, router]
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return people.filter((p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)).slice(0, 8);
  }, [people, query]);

  return (
    <div className="space-y-5">
      <div className="panel flex items-center justify-between p-4">
        <div>
          <p className="font-chakra text-3xl font-bold tabular-nums">
            {count}
            <span className="text-lg text-muted-foreground"> / {people.length}</span>
          </p>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Checked in</p>
        </div>
        <Button onClick={() => setCameraOn((v) => !v)} variant={cameraOn ? "outline" : "default"} className="font-chakra">
          {cameraOn ? <CameraOff /> : <Camera />} {cameraOn ? "Stop camera" : "Start scanning"}
        </Button>
      </div>

      {cameraOn && (
        <div className="panel relative mx-auto aspect-square w-full max-w-md overflow-hidden">
          <Scanner
            onScan={onScan}
            onError={(err) => {
              console.error("[check-in] scanner error", err);
              setFeedback({
                kind: "error",
                message:
                  err.kind === "permission-denied"
                    ? "Camera access was blocked. Allow it in your browser settings, or use search below."
                    : err.kind === "insecure-context"
                      ? "The camera needs a secure (https) connection. Use search below."
                      : `Couldn't start the camera${err.message ? ` (${err.message})` : ""}. Use search below.`,
              });
            }}
            // Soft preferences only. The library default demands >=640px height,
            // which fails on common 640x480 laptop webcams.
            constraints={{
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }}
            formats={["qr_code"]}
            allowMultiple
            scanDelay={800}
            sound={false}
            components={{ finder: true }}
            styles={{ container: { width: "100%", height: "100%" } }}
          />
          {busy && (
            <div className="absolute inset-0 grid place-items-center bg-black/50">
              <Loader2 className="size-10 animate-spin" />
            </div>
          )}
        </div>
      )}

      {feedback && <FeedbackCard feedback={feedback} onDismiss={() => setFeedback(null)} />}

      <div className="panel space-y-3 p-4">
        <p className="font-chakra text-sm font-bold uppercase tracking-wide">Manual check-in</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <TextInput className="pl-9" placeholder="Type a name or email…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {matches.length > 0 && (
          <ul className="divide-y rounded-md border">
            {matches.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.course}</p>
                </div>
                <Button
                  size="sm"
                  variant={isIn(p) ? "outline" : "default"}
                  onClick={async () => {
                    const next = !isIn(p);
                    setLocalIn((m) => ({ ...m, [p.id]: next }));
                    const res = await setCheckedIn(p.id, next);
                    if (!res.ok) {
                      setLocalIn((m) => ({ ...m, [p.id]: !next }));
                      setFeedback({ kind: "error", message: res.error });
                    } else start(() => router.refresh());
                  }}
                >
                  {isIn(p) ? "Undo" : "Check in"}
                </Button>
              </li>
            ))}
          </ul>
        )}
        {query.trim().length >= 2 && matches.length === 0 && <p className="text-sm text-muted-foreground">No one by that name signed up.</p>}
      </div>
    </div>
  );
}

function FeedbackCard({ feedback, onDismiss }: { feedback: Feedback; onDismiss: () => void }) {
  const tone =
    feedback.kind === "ok"
      ? "border-emerald-500/50 bg-emerald-500/10"
      : feedback.kind === "repeat"
        ? "border-amber-500/50 bg-amber-500/10"
        : "border-red-500/50 bg-red-500/10";
  const Icon = feedback.kind === "ok" ? CheckCircle2 : feedback.kind === "repeat" ? AlertTriangle : XCircle;
  return (
    <button onClick={onDismiss} className={cn("flex w-full items-start gap-4 rounded-xl border p-4 text-left", tone)} aria-live="assertive">
      <Icon
        className={cn(
          "mt-0.5 size-8 shrink-0",
          feedback.kind === "ok" ? "text-emerald-300" : feedback.kind === "repeat" ? "text-amber-300" : "text-red-300"
        )}
      />
      {feedback.kind === "error" ? (
        <div>
          <p className="font-chakra text-lg font-bold">Not checked in</p>
          <p className="text-sm text-muted-foreground">{feedback.message}</p>
        </div>
      ) : (
        <div>
          <p className="font-chakra text-xl font-bold">{feedback.data.name}</p>
          <p className="text-sm text-muted-foreground">
            {feedback.data.course} · {feedback.data.yearLevel}
            {feedback.data.teamName && ` · Team ${feedback.data.teamName}`}
          </p>
          <p className="mt-1 text-sm">
            {feedback.kind === "ok" ? "Welcome! Checked in." : `Already checked in at ${formatTime(feedback.data.checkedInAt)}.`}
          </p>
        </div>
      )}
    </button>
  );
}
