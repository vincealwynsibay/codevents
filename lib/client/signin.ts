"use client";

import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { clientAuth } from "./firebase";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/domain";

export type SignInResult = { ok: true } | { ok: false; error: string; cancelled?: boolean };

/**
 * Google popup → server session cookie. Shared by the login page and the terminal.
 * Must be called from a user gesture (click or keypress) so the popup isn't blocked.
 */
export async function signInWithGoogle(): Promise<SignInResult> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ hd: ALLOWED_EMAIL_DOMAIN, prompt: "select_account" });
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
      return { ok: false, error: body.error || "Sign-in failed." };
    }
    return { ok: true };
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      return { ok: false, error: "Sign-in cancelled.", cancelled: true };
    }
    if (code === "auth/popup-blocked") {
      return { ok: false, error: "Your browser blocked the sign-in popup. Allow popups for this site and try again." };
    }
    return { ok: false, error: (e as Error).message || "Sign-in failed." };
  }
}
