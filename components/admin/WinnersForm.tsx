"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trophy } from "lucide-react";
import { Place } from "@/lib/domain";
import { setWinners } from "@/lib/actions/events";
import { Button } from "@/components/ui/button";
import { Field, NativeSelect } from "@/components/form/fields";
import { toast } from "@/hooks/use-toast";

export default function WinnersForm({
  eventId,
  prizes,
  current,
  options,
}: {
  eventId: string;
  prizes: { place: Place; label: string }[];
  current: { place: Place; refId: string }[];
  options: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [picks, setPicks] = useState<Record<number, string>>(() =>
    Object.fromEntries(prizes.map((p) => [p.place, current.find((c) => c.place === p.place)?.refId ?? ""]))
  );
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    start(async () => {
      const res = await setWinners(
        eventId,
        prizes.map((p) => ({ place: p.place, refId: picks[p.place] ?? "" }))
      );
      if (!res.ok) return setError(res.error);
      toast({ title: res.message });
      router.refresh();
    });
  }

  if (options.length === 0) {
    return <div className="panel px-6 py-12 text-center text-sm text-muted-foreground">No entries to pick from yet.</div>;
  }

  const chosen = Object.values(picks).filter(Boolean);
  return (
    <div className="panel max-w-2xl space-y-4 p-5">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Trophy className="size-4 text-amber-300" /> Winners appear on the public page and on certificates right away.
      </p>
      {prizes.map((p) => (
        <Field key={p.place} label={p.label}>
          <NativeSelect value={picks[p.place] ?? ""} onChange={(e) => setPicks({ ...picks, [p.place]: e.target.value })}>
            <option value="">No winner</option>
            {options.map((o) => (
              <option key={o.id} value={o.id} disabled={chosen.includes(o.id) && picks[p.place] !== o.id}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      ))}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button onClick={save} disabled={pending} className="font-chakra tracking-wide">
        {pending && <Loader2 className="animate-spin" />} Save winners
      </Button>
    </div>
  );
}
