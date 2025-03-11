"use client";

import { useEffect } from "react";

/** Opens the shell in full-screen (tty) mode on mount. */
export default function OpenTerminal() {
  useEffect(() => {
    // On a hard load this runs before the shell's listener exists; the shell reads this flag on mount.
    try {
      localStorage.setItem("codevents:tty", "1");
    } catch {}
    window.dispatchEvent(new CustomEvent("codevents:terminal", { detail: { tty: true } }));
  }, []);
  return null;
}
