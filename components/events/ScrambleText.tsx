"use client";

import { useEffect, useState } from "react";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** Decodes text letter by letter, hacker-style. */
export default function ScrambleText({ text, duration = 600 }: { text: string; duration?: number }) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    const id = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((ch, idx) => (idx < i || ch === " " ? ch : LETTERS[Math.floor(Math.random() * LETTERS.length)]))
          .join("")
      );
      if (i >= text.length) clearInterval(id);
      i += 1;
    }, duration / Math.max(1, text.length));
    return () => clearInterval(id);
  }, [text, duration]);

  return (
    <span aria-label={text}>
      <span aria-hidden>{display}</span>
    </span>
  );
}
