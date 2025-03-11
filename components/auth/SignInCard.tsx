"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { clientAuth } from "@/lib/client/firebase";
import { Button } from "@/components/ui/button";

export default function SignInCard({ next, domain }: { next: string; domain: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setPending(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ hd: domain, prompt: "select_account" });
      const cred = await signInWithPopup(clientAuth, provider);
      const idToken = await cred.user.getIdToken();
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      // The server holds the session from here; drop the client-side copy.
      await signOut(clientAuth).catch(() => {});
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Sign-in failed.");
      }
      router.replace(next);
      router.refresh();
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setPending(false);
        return;
      }
      setError((e as Error).message || "Sign-in failed.");
      setPending(false);
    }
  }

  return (
    <div className="panel hud relative w-full overflow-hidden p-8 text-center">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="pointer-events-none absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
      <div className="relative">
      <p className="eyebrow">CODES · UM Tagum</p>
      <h1 className="mt-3 font-chakra text-3xl font-bold">Sign in to codevents</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Use your <span className="text-foreground">@{domain}</span> Google account to sign up for events,
        get your check-in QR and download certificates.
      </p>
      <Button onClick={signIn} disabled={pending} size="lg" className="mt-8 w-full font-chakra tracking-wide">
        {pending ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </Button>
      {error && (
        <p role="alert" className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        Officers can sign in with the Google account an owner added.
      </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path fill="#fff" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.67 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.95S8.78 6.28 12 6.28c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.68 3.74 14.55 2.8 12 2.8 6.95 2.8 2.86 6.9 2.86 11.95S6.95 21.1 12 21.1c6.93 0 9.2-4.86 9.2-7.36 0-.5-.05-.87-.12-1.25z" />
    </svg>
  );
}
