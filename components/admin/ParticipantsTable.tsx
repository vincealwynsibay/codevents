"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Search, UserMinus } from "lucide-react";
import { Registration, formatDateTime } from "@/lib/domain";
import { adminRemoveRegistration, setCheckedIn } from "@/lib/actions/registrations";
import { TextInput, NativeSelect } from "@/components/form/fields";
import ConfirmButton from "@/components/site/ConfirmButton";
import Avatar from "@/components/site/Avatar";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ParticipantsTable({
  registrations,
  teams,
}: {
  registrations: Registration[];
  teams: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, start] = useTransition();
  const teamName = (id: string | null) => teams.find((t) => t.id === id)?.name ?? "";

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return registrations.filter((r) => {
      if (filter === "in" && !r.checkedInAt) return false;
      if (filter === "out" && r.checkedInAt) return false;
      if (!q) return true;
      return [r.name, r.email, r.course, r.yearLevel, teamName(r.teamId)].some((s) => s.toLowerCase().includes(q));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrations, query, filter]);

  function toggle(r: Registration) {
    setPendingId(r.id);
    start(async () => {
      const res = await setCheckedIn(r.id, !r.checkedInAt);
      setPendingId(null);
      if (!res.ok) toast({ title: res.error, variant: "destructive" });
      router.refresh();
    });
  }

  if (registrations.length === 0) {
    return <div className="panel px-6 py-12 text-center text-sm text-muted-foreground">No one has signed up yet.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <TextInput className="pl-9" placeholder="Search name, email, course, team…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <NativeSelect className="w-auto" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
          <option value="all">Everyone</option>
          <option value="in">Checked in</option>
          <option value="out">Not checked in</option>
        </NativeSelect>
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Course / year</th>
              {teams.length > 0 && <th className="p-3 font-medium">Team</th>}
              <th className="p-3 font-medium">Signed up</th>
              <th className="p-3 font-medium">Check-in</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-white/[0.02]">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.name} src={r.photoURL} size={28} />
                    <div className="min-w-0">
                      <p className="font-medium">{r.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">
                  {r.course}
                  <br />
                  <span className="text-xs">{r.yearLevel}</span>
                </td>
                {teams.length > 0 && <td className="p-3">{teamName(r.teamId)}</td>}
                <td className="p-3 text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</td>
                <td className="p-3">
                  <button
                    onClick={() => toggle(r)}
                    disabled={pendingId === r.id}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-50",
                      r.checkedInAt
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                        : "text-muted-foreground hover:border-white/30 hover:text-foreground"
                    )}
                    title={r.checkedInAt ? `Checked in ${formatDateTime(r.checkedInAt)}. Click to undo.` : "Mark as checked in"}
                  >
                    {r.checkedInAt ? <Check className="size-3" /> : null}
                    {r.checkedInAt ? "Checked in" : "Check in"}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <ConfirmButton
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove ${r.name}`}
                    title={`Remove ${r.name}?`}
                    description="Their registration is deleted and their spot freed. They can sign up again while registration is open."
                    confirmLabel="Remove"
                    onConfirm={async () => {
                      const res = await adminRemoveRegistration(r.id);
                      toast(res.ok ? { title: res.message } : { title: res.error, variant: "destructive" });
                      router.refresh();
                    }}
                  >
                    <UserMinus />
                  </ConfirmButton>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No matches.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Showing {rows.length} of {registrations.length}.
      </p>
    </div>
  );
}
