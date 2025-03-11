import "server-only";
import { ZodError } from "zod";
import { ActionError } from "./auth";

export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function runAction<T>(
  fn: () => Promise<{ message?: string; data?: T } | void>
): Promise<ActionResult<T>> {
  try {
    const res = (await fn()) || {};
    return { ok: true, ...res };
  } catch (e) {
    if (e instanceof ActionError) return { ok: false, error: e.message };
    if (e instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of e.issues) {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return {
        ok: false,
        error: "Please fix the highlighted fields.",
        fieldErrors,
      };
    }
    // Next.js redirect()/notFound() throw special errors that must propagate.
    if (
      e &&
      typeof e === "object" &&
      "digest" in e &&
      typeof (e as { digest: unknown }).digest === "string" &&
      (e as { digest: string }).digest.startsWith("NEXT_")
    ) {
      throw e;
    }
    console.error(e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export function randomToken(length = 24) {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function randomCode(length = 6) {
  // No 0/O/1/I so codes are easy to read aloud.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
