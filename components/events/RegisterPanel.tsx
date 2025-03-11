"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Award, Check, Copy, Crown, Loader2, Ticket } from "lucide-react";
import { Participation, Phase } from "@/lib/domain";
import { cancelRegistration, registerForEvent } from "@/lib/actions/registrations";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/form/fields";
import { toast } from "@/hooks/use-toast";
import ConfirmButton from "@/components/site/ConfirmButton";
import { cn } from "@/lib/utils";

export type RegisterState =
  | { kind: "anon" }
  | { kind: "needsProfile" }
  | { kind: "eligible" }
  | {
      kind: "registered";
      checkedIn: boolean;
      team: { name: string; code: string; members: string[]; isCaptain: boolean } | null;
    };

const closedCopy: Partial<Record<Phase, string>> = {
  DRAFT: "This event isn't published yet.",
  CANCELLED: "This event was cancelled.",
  REGISTRATION_CLOSED: "Registration is closed.",
  ONGOING: "This event is happening now.",
  AWAITING_RESULTS: "This event has ended. Results are coming soon.",
  COMPLETED: "This event has ended.",
};

export default function RegisterPanel({
  eventId,
  phase,
  participation,
  teamMin,
  teamMax,
  state,
  ticket,
  certificateHref,
}: {
  eventId: string;
  phase: Phase;
  participation: Participation;
  teamMin: number;
  teamMax: number;
  state: RegisterState;
  ticket: React.ReactNode;
  certificateHref: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [teamMode, setTeamMode] = useState<"create" | "join">("create");
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const next = `/events/${eventId}`;
  const open = phase === "REGISTRATION_OPEN";

  function register() {
    setError(null);
    start(async () => {
      const res = await registerForEvent(
        eventId,
        participation === "TEAM"
          ? teamMode === "create"
            ? { mode: "create", name: teamName }
            : { mode: "join", code: teamCode }
          : undefined
      );
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast({ title: res.message });
      router.refresh();
    });
  }

  async function cancel() {
    const res = await cancelRegistration(eventId);
    if (!res.ok) {
      toast({ title: res.error, variant: "destructive" });
      return;
    }
    toast({ title: res.message });
    router.refresh();
  }

  if (state.kind === "registered") {
    const canCancel = !state.checkedIn && (phase === "REGISTRATION_OPEN" || phase === "REGISTRATION_CLOSED");
    return (
      <div className="panel space-y-4 p-5">
        <div className="flex items-center gap-2 text-emerald-300">
          <Check className="size-5" />
          <p className="font-chakra font-bold">{state.checkedIn ? "You're checked in" : "You're registered"}</p>
        </div>

        {state.team && (
          <div className="rounded-lg border bg-black/30 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Your team</p>
              <span
                className={cn(
                  "text-xs",
                  state.team.members.length >= teamMin ? "text-emerald-300" : "text-amber-300"
                )}
              >
                {state.team.members.length}/{teamMax}
                {state.team.members.length < teamMin && ` · needs ${teamMin - state.team.members.length} more`}
              </span>
            </div>
            <p className="mt-1 font-chakra text-lg font-bold">{state.team.name}</p>
            <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">
              {state.team.members.map((m, i) => (
                <li key={`${m}-${i}`} className="flex items-center gap-1.5">
                  {i === 0 ? <Crown className="size-3 text-amber-300" /> : <span className="size-3" />}
                  {m}
                </li>
              ))}
            </ul>
            {state.team.members.length < teamMax && open && <TeamCode code={state.team.code} />}
          </div>
        )}

        {ticket && (
          <div className="space-y-2 text-center">
            {ticket}
            <p className="text-xs text-muted-foreground">Show this QR at the venue to check in.</p>
          </div>
        )}

        {certificateHref && (
          <Button asChild className="w-full">
            <Link href={certificateHref}>
              <Award /> Get your certificate
            </Link>
          </Button>
        )}

        <Button asChild variant="outline" className="w-full">
          <Link href="/me">
            <Ticket /> All my events
          </Link>
        </Button>

        {canCancel && (
          <ConfirmButton
            title="Cancel your registration?"
            description={
              state.team
                ? "You'll be removed from your team. If you're the last member, the team is deleted."
                : "Your spot will be released to someone else."
            }
            confirmLabel="Cancel registration"
            onConfirm={cancel}
            variant="ghost"
            className="w-full text-muted-foreground"
          >
            Cancel registration
          </ConfirmButton>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <div className="panel p-5 text-sm text-muted-foreground">
        <p>{closedCopy[phase] ?? "Registration is closed."}</p>
        {state.kind === "anon" && (phase === "AWAITING_RESULTS" || phase === "COMPLETED") && (
          <p className="mt-2">
            Joined this event?{" "}
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-blue-300 underline-offset-4 hover:underline">
              Sign in
            </Link>{" "}
            to get your certificate.
          </p>
        )}
      </div>
    );
  }

  if (state.kind === "anon") {
    return (
      <div className="panel space-y-3 p-5">
        <p className="font-chakra text-lg font-bold">Join this event</p>
        <p className="text-sm text-muted-foreground">Sign in with your school Google account to register.</p>
        <Button asChild size="lg" className="w-full font-chakra tracking-wide">
          <Link href={`/login?next=${encodeURIComponent(next)}`}>Sign in to register</Link>
        </Button>
      </div>
    );
  }

  if (state.kind === "needsProfile") {
    return (
      <div className="panel space-y-3 p-5">
        <p className="font-chakra text-lg font-bold">One more step</p>
        <p className="text-sm text-muted-foreground">Confirm your course and year level before signing up.</p>
        <Button asChild size="lg" className="w-full font-chakra tracking-wide">
          <Link href={`/onboarding?next=${encodeURIComponent(next)}`}>Complete profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="panel space-y-4 p-5">
      <p className="font-chakra text-lg font-bold">Join this event</p>
      {participation === "TEAM" && (
        <>
          <div className="grid grid-cols-2 gap-1 rounded-lg border bg-black/30 p-1 text-sm">
            {(["create", "join"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setTeamMode(m);
                  setError(null);
                }}
                className={cn(
                  "rounded-md py-1.5 font-chakra transition-colors",
                  teamMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "create" ? "Create a team" : "Join a team"}
              </button>
            ))}
          </div>
          {teamMode === "create" ? (
            <div className="space-y-1.5">
              <TextInput
                placeholder="Team name"
                value={teamName}
                maxLength={40}
                onChange={(e) => setTeamName(e.target.value)}
                aria-label="Team name"
              />
              <p className="text-xs text-muted-foreground">
                You&apos;ll get a code to share with up to {teamMax - 1} teammates.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <TextInput
                placeholder="6-letter team code"
                value={teamCode}
                maxLength={6}
                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                className="font-chakra tracking-[0.3em]"
                aria-label="Team code"
              />
              <p className="text-xs text-muted-foreground">Ask your team captain for the code.</p>
            </div>
          )}
        </>
      )}
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <Button onClick={register} disabled={pending} size="lg" className="w-full font-chakra tracking-wide">
        {pending && <Loader2 className="animate-spin" />}
        {participation === "TEAM" ? (teamMode === "create" ? "Create team & register" : "Join team & register") : "Register"}
      </Button>
    </div>
  );
}

function TeamCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="mt-3 flex w-full items-center justify-between rounded-md border border-dashed border-primary/50 bg-primary/10 px-3 py-2 text-left"
    >
      <span>
        <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">Invite code</span>
        <span className="font-chakra text-lg font-bold tracking-[0.3em]">{code}</span>
      </span>
      {copied ? <Check className="size-4 text-emerald-300" /> : <Copy className="size-4" />}
    </button>
  );
}
