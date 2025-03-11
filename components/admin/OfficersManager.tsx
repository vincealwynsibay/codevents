"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, X } from "lucide-react";
import { AdminRecord, AdminRole, formatDate } from "@/lib/domain";
import { addAdmin, removeAdmin } from "@/lib/actions/admins";
import { Button } from "@/components/ui/button";
import { NativeSelect, TextInput } from "@/components/form/fields";
import ConfirmButton from "@/components/site/ConfirmButton";
import { toast } from "@/hooks/use-toast";

export default function OfficersManager({
  admins,
  envOwners,
  me,
}: {
  admins: AdminRecord[];
  envOwners: string[];
  me: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("OFFICER");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await addAdmin(email, role);
      if (!res.ok) return setError(res.fieldErrors ? Object.values(res.fieldErrors)[0] : res.error);
      toast({ title: res.message });
      setEmail("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="panel flex flex-wrap items-start gap-2 p-4">
        <TextInput
          type="email"
          placeholder="officer@umindanao.edu.ph"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-w-[220px] flex-1"
          required
          aria-label="Email"
        />
        <NativeSelect value={role} onChange={(e) => setRole(e.target.value as AdminRole)} className="w-auto" aria-label="Role">
          <option value="OFFICER">Officer</option>
          <option value="OWNER">Owner</option>
        </NativeSelect>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <UserPlus />} Add
        </Button>
        {error && <p className="w-full text-sm text-red-400">{error}</p>}
      </form>

      <div className="panel divide-y">
        {envOwners.map((e) => (
          <Row key={`env-${e}`} email={e} role="OWNER" meta="Set in server config (OWNER_EMAILS)" />
        ))}
        {admins
          .filter((a) => !envOwners.includes(a.email))
          .map((a) => (
            <Row
              key={a.email}
              email={a.email}
              role={a.role}
              meta={`Added by ${a.addedBy} · ${formatDate(a.addedAt)}`}
              action={
                a.email !== me && (
                  <ConfirmButton
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove ${a.email}`}
                    title={`Remove ${a.email}?`}
                    description="They'll lose officer access the next time they load a page."
                    confirmLabel="Remove"
                    onConfirm={async () => {
                      const res = await removeAdmin(a.email);
                      toast(res.ok ? { title: res.message } : { title: res.error, variant: "destructive" });
                      router.refresh();
                    }}
                  >
                    <X />
                  </ConfirmButton>
                )
              }
            />
          ))}
        {envOwners.length === 0 && admins.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">No officers yet.</p>
        )}
      </div>
    </div>
  );
}

function Row({ email, role, meta, action }: { email: string; role: AdminRole; meta: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{email}</p>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <span
        className={
          role === "OWNER"
            ? "rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-200"
            : "rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
        }
      >
        {role === "OWNER" ? "Owner" : "Officer"}
      </span>
      {action}
    </div>
  );
}
