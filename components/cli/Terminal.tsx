"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Maximize2, Minimize2, X } from "lucide-react";
import QRCode from "qrcode";
import { cancelRegistration, registerForEvent, saveProfile } from "@/lib/actions/registrations";
import { cn } from "@/lib/utils";
import { signInWithGoogle } from "@/lib/client/signin";

/*
  The CODES shell. The whole app as a tiny filesystem:

    ~/                     home
    ~/events/<event>/      upcoming events      (cat, register, cancel, ticket)
    ~/past/<event>/        past events + winners
    ~/me/                  your tickets
    ~/admin/               officers only (opens the dashboard)

  `gui` opens the visual page for wherever you are. `tty` keeps the shell
  full-screen while you move around, so you never have to leave it.
*/

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

type Row = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  type: string;
  phase: string;
  startDate: string;
  endDate: string;
  venue: string;
  count: number;
  capacity: number | null;
  participation: "SOLO" | "TEAM";
  teamMin: number;
  teamMax: number;
  winners: { place: number; name: string }[];
};
type Ticket = {
  eventId: string;
  regId: string;
  qr: string;
  checkedIn: boolean;
  team: { name: string; code: string; members: string[] } | null;
};
type CliData = {
  upcoming: Row[];
  past: Row[];
  tickets: Ticket[];
  viewer: {
    name: string;
    email: string;
    course: string | null;
    yearLevel: string | null;
    role: string | null;
    profileComplete: boolean;
  } | null;
};

type Tone = "out" | "dim" | "ok" | "warn" | "err" | "accent" | "cmd" | "dir";
type Line = { text: string; tone?: Tone; href?: string; run?: string; svg?: string };

const TONE: Record<Tone, string> = {
  out: "text-neutral-200",
  dim: "text-neutral-500",
  ok: "text-emerald-300",
  warn: "text-amber-300",
  err: "text-red-400",
  accent: "text-blue-300",
  cmd: "text-neutral-100",
  dir: "text-blue-300 font-semibold",
};

const PHASE_TAG: Record<string, [string, Tone]> = {
  REGISTRATION_OPEN: ["OPEN", "ok"],
  REGISTRATION_CLOSED: ["CLOSED", "warn"],
  ONGOING: ["LIVE", "accent"],
  AWAITING_RESULTS: ["JUDGING", "warn"],
  COMPLETED: ["DONE", "dim"],
  CANCELLED: ["CANCELLED", "err"],
  DRAFT: ["DRAFT", "dim"],
};

const COMMANDS = [
  "help", "man", "ls", "cd", "pwd", "tree", "cat", "gui", "open", "register", "cancel", "ticket",
  "team", "whoami", "login", "logout", "profile", "winners", "tty", "neofetch", "date", "echo",
  "clear", "history", "exit", "debug", "coffee", "hack", "sudo",
] as const;

const MAN: Record<string, string> = {
  ls: "ls [path]            list what's in a folder (default: here)",
  cd: "cd <path|#>          move around: cd events, cd 2, cd .., cd ~",
  pwd: "pwd                  where am I?",
  tree: "tree                 the whole map",
  cat: "cat [event|#]        event details (inside an event folder: just `cat`)",
  gui: "gui [path]           open the visual page for here (alias: open)",
  register: "register [event] [--team \"Name\" | --join CODE]   sign up",
  cancel: "cancel [event]       drop your registration (before it starts)",
  ticket: "ticket [event]       your check-in QR, right in the terminal",
  team: "team [event]         your team, members and invite code",
  whoami: "whoami               who you're signed in as",
  profile: 'profile [--course "…"] [--year "…"] [--name "…"]   view or set your profile',
  tty: "tty                  full-screen shell that stays open while you navigate",
  winners: "winners              hall of fame",
};

const BANNER = String.raw`
  ____ ___  ____  _____ ____
 / ___/ _ \|  _ \| ____/ ___|
| |  | | | | | | |  _| \___ \
| |__| |_| | |_| | |___ ___) |
 \____\___/|____/|_____|____/   shell v1
`;

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", month: "short", day: "2-digit" }).format(new Date(iso));
const fmtFull = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" });
const pad = (s: string, n: number) => (s.length >= n ? s.slice(0, n - 1) + "…" : s + " ".repeat(n - s.length));
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const MEDAL = ["", "🥇", "🥈", "🥉"];

// split respecting quotes: register --team "Null Pointers"
function tokenize(s: string) {
  return [...s.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map((m) => m[1] ?? m[2] ?? m[3]);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Terminal() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [tty, setTty] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIndex, setHIndex] = useState<number | null>(null);
  const [data, setData] = useState<CliData | null>(null);
  const [cwd, setCwd] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ---- persistence (best effort) ----
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("codevents:history") || "[]");
      if (Array.isArray(saved)) setHistory(saved.slice(-50));
      if (localStorage.getItem("codevents:tty") === "1") {
        setTty(true);
        setOpen(true);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("codevents:tty", tty ? "1" : "0");
    } catch {}
  }, [tty]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/cli", { cache: "no-store" });
      const json = (await res.json()) as CliData;
      setData(json);
      return json;
    } catch {
      return null;
    }
  }, []);

  // ---- open / close ----
  useEffect(() => {
    const typing = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "`" && !typing(e.target)) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = (e: Event) => {
      if ((e as CustomEvent).detail?.tty) setTty(true);
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("codevents:terminal", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("codevents:terminal", onOpen);
    };
  }, []);

  // On open: greet once, refresh data, and start in the folder that matches the page you're on.
  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 30);
    if (lines.length === 0) {
      setLines([
        ...BANNER.split("\n").filter(Boolean).map((t) => ({ text: t, tone: "accent" as Tone })),
        { text: "" },
        { text: "the whole site, as a filesystem. type `help` · `ls` · `cd events`", tone: "dim" },
        { text: "Tab completes · ↑/↓ history · `tty` for full-screen · Esc closes", tone: "dim" },
        { text: "" },
      ]);
    }
    load().then((d) => {
      if (!d) return;
      const m = /^\/events\/([^/?#]+)/.exec(pathname);
      if (m) {
        const up = d.upcoming.find((e) => e.id === m[1]);
        const past = d.past.find((e) => e.id === m[1]);
        if (up) setCwd(["events", slug(up.title)]);
        else if (past) setCwd(["past", slug(past.title)]);
      } else if (pathname === "/me") setCwd(["me"]);
      else if (pathname.startsWith("/admin")) setCwd(["admin"]);
      else if (pathname === "/events") setCwd(["events"]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const print = (...ls: Line[]) => setLines((prev) => [...prev, ...ls]);

  // ---- filesystem helpers ----
  const pathStr = (p: string[]) => (p.length ? `~/${p.join("/")}` : "~");

  function eventsIn(d: CliData, dir: "events" | "past") {
    return dir === "events" ? d.upcoming : d.past;
  }
  function eventAt(d: CliData, p: string[]): Row | null {
    if (p.length < 2 || (p[0] !== "events" && p[0] !== "past")) return null;
    return eventsIn(d, p[0]).find((e) => slug(e.title) === p[1]) ?? null;
  }
  function ticketFor(d: CliData, eventId: string) {
    return d.tickets.find((t) => t.eventId === eventId) ?? null;
  }

  /** Children of a folder, in display order. */
  function children(d: CliData, p: string[]): { name: string; dir: boolean; hint?: string; tone?: Tone }[] {
    if (p.length === 0) {
      return [
        { name: "events", dir: true, hint: `${d.upcoming.length} upcoming` },
        { name: "past", dir: true, hint: `${d.past.length} done` },
        ...(d.viewer ? [{ name: "me", dir: true, hint: `${d.tickets.length} tickets` }] : []),
        ...(d.viewer?.role ? [{ name: "admin", dir: true, hint: "officers" }] : []),
        { name: "README", dir: false },
      ];
    }
    if (p.length === 1 && (p[0] === "events" || p[0] === "past")) {
      return eventsIn(d, p[0]).map((e) => {
        const [tag, tone] = PHASE_TAG[e.phase] ?? ["?", "dim" as Tone];
        const mine = ticketFor(d, e.id) ? " ✓ registered" : "";
        return { name: slug(e.title), dir: true, hint: `${fmtDate(e.startDate)} ${tag}${mine}`, tone };
      });
    }
    if (p.length === 1 && p[0] === "me") {
      const all = [...d.upcoming, ...d.past];
      return d.tickets
        .map((t) => all.find((e) => e.id === t.eventId))
        .filter((e): e is Row => !!e)
        .map((e) => ({ name: slug(e.title), dir: true, hint: d.upcoming.includes(e) ? "upcoming" : "past" }));
    }
    if (p.length === 1 && p[0] === "admin") return [{ name: "dashboard", dir: false, hint: "run `gui`" }];
    const e = eventAt(d, p);
    if (e) {
      const t = ticketFor(d, e.id);
      return [
        { name: "info.txt", dir: false },
        ...(e.winners.length ? [{ name: "winners.txt", dir: false }] : []),
        ...(t ? [{ name: "ticket.qr", dir: false }] : []),
        ...(t?.team ? [{ name: "team.txt", dir: false }] : []),
      ];
    }
    return [];
  }

  /** Resolve a path argument (relative, ~, .., or a listing number) from the cwd. */
  function resolve(d: CliData, arg: string): string[] | null {
    let parts: string[] = arg.startsWith("~") || arg.startsWith("/") ? [] : [...cwd];
    const segs = arg.replace(/^~\/?|^\//, "").split("/").filter(Boolean);
    for (const seg of segs) {
      if (seg === ".") continue;
      if (seg === "..") {
        parts.pop();
        continue;
      }
      // `me/<event>` is a shortcut into events/ or past/
      if (parts.length === 1 && parts[0] === "me") {
        const all = [...d.upcoming, ...d.past];
        const kids = children(d, parts);
        const n = Number(seg);
        const name = Number.isInteger(n) && n >= 1 && n <= kids.length ? kids[n - 1].name : seg;
        const e = all.find((x) => slug(x.title) === name || slug(x.title).startsWith(slug(name)));
        if (!e) return null;
        parts = [d.upcoming.includes(e) ? "events" : "past", slug(e.title)];
        continue;
      }
      const kids = children(d, parts).filter((k) => k.dir);
      const n = Number(seg);
      const hit =
        Number.isInteger(n) && n >= 1 && n <= kids.length
          ? kids[n - 1]
          : kids.find((k) => k.name === seg) ?? kids.find((k) => k.name.startsWith(slug(seg)));
      if (!hit) return null;
      parts = [...parts, hit.name];
    }
    return parts;
  }

  function guiHref(d: CliData, p: string[]) {
    if (p.length === 0) return "/";
    if (p[0] === "me") return "/me";
    if (p[0] === "admin") return "/admin";
    const e = eventAt(d, p);
    if (e) return `/events/${e.id}`;
    return p[0] === "past" ? "/events?view=past" : "/events";
  }

  /** The event an action targets: the argument if given, else the event folder you're in. */
  function targetEvent(d: CliData, arg: string | undefined): Row | null {
    if (arg) {
      const p = resolve(d, arg.includes("/") ? arg : `~/events/${arg}`) ?? resolve(d, `~/past/${arg}`) ?? resolve(d, arg);
      return p ? eventAt(d, p) : null;
    }
    return eventAt(d, cwd);
  }

  function infoLines(e: Row, t: Ticket | null): Line[] {
    const [tag, tone] = PHASE_TAG[e.phase] ?? ["?", "dim" as Tone];
    return [
      { text: `# ${e.title}`, tone: "accent" },
      ...(e.tagline ? [{ text: e.tagline, tone: "dim" as Tone }] : []),
      { text: `status   ${tag}${t ? "  · you're registered" : ""}`, tone },
      { text: `when     ${fmtFull(e.startDate)} → ${fmtFull(e.endDate)}` },
      { text: `where    ${e.venue}` },
      {
        text: `format   ${e.participation === "TEAM" ? `teams of ${e.teamMin}-${e.teamMax}` : "solo"} · ${e.count}${e.capacity ? `/${e.capacity}` : ""} signed up`,
      },
      { text: "" },
      ...e.description.split("\n").map((l) => ({ text: l, tone: "out" as Tone })),
    ];
  }

  // ---- commands ----
  async function run(raw: string) {
    const cmdline = raw.trim();
    print({ text: `codes@codevents:${pathStr(cwd)}$ ${cmdline}`, tone: "cmd" });
    if (!cmdline) return;
    const nextHistory = [...history.filter((h) => h !== cmdline), cmdline].slice(-50);
    setHistory(nextHistory);
    try {
      localStorage.setItem("codevents:history", JSON.stringify(nextHistory));
    } catch {}

    const [cmdRaw, ...args] = tokenize(cmdline);
    const cmd = cmdRaw.toLowerCase();
    const arg = args.join(" ");
    const d = data ?? (await load());
    if (!d && !["help", "man", "clear", "exit", "tty", "echo", "date", "coffee", "sudo", "rm", "hack"].includes(cmd)) {
      return print({ text: "couldn't reach the server. try again in a sec.", tone: "err" });
    }

    const go = (href: string) => {
      router.push(href);
      if (!tty) setTimeout(() => setOpen(false), 150);
    };

    switch (cmd) {
      case "help":
        print(
          { text: "navigate", tone: "accent" },
          { text: "  ls · cd <path|#> · pwd · tree · gui (open the page for here)" },
          { text: "events", tone: "accent" },
          { text: "  cat · register [--team \"Name\" | --join CODE] · cancel · ticket · team · winners" },
          { text: "you", tone: "accent" },
          { text: "  whoami · login · logout · profile" },
          { text: "shell", tone: "accent" },
          { text: "  tty · man <cmd> · history · clear · neofetch · date · echo · exit" },
          { text: "try: cd events → ls → cd 1 → cat → register", tone: "dim" }
        );
        break;

      case "man":
        if (!arg) return print({ text: "what manual page do you want? e.g. `man register`", tone: "warn" });
        print({ text: MAN[arg] ?? `No manual entry for ${arg}`, tone: MAN[arg] ? "out" : "err" });
        break;

      case "pwd":
        print({ text: pathStr(cwd) });
        break;

      case "ls":
      case "ll":
      case "dir": {
        const target = arg && !arg.startsWith("-") ? resolve(d!, arg) : cwd;
        if (!target) return print({ text: `ls: cannot access '${arg}': No such file or directory`, tone: "err" });
        const kids = children(d!, target);
        if (kids.length === 0) {
          print({ text: target[0] === "me" ? "no tickets yet. `cd ~/events` to find one." : "(empty)", tone: "dim" });
          break;
        }
        const numbered = target.length === 1 && ["events", "past", "me"].includes(target[0]);
        kids.forEach((k, i) =>
          print({
            text: `${numbered ? String(i + 1).padStart(3) + "  " : ""}${pad(k.name + (k.dir ? "/" : ""), 38)}${k.hint ?? ""}`,
            tone: k.dir ? k.tone ?? "dir" : "out",
            run: k.dir ? `cd ${pathStr([...target, k.name])}` : k.name === "README" ? "cat README" : undefined,
          })
        );
        break;
      }

      case "cd": {
        if (!arg || arg === "~") {
          setCwd([]);
          break;
        }
        if (arg === "-") return print({ text: "cd: OLDPWD not set (we don't keep secrets)", tone: "dim" });
        const target = resolve(d!, arg);
        if (!target) return print({ text: `cd: no such file or directory: ${arg}`, tone: "err" });
        if (target[0] === "admin" && !d!.viewer?.role) return print({ text: "cd: admin: Permission denied", tone: "err" });
        if (target[0] === "me" && !d!.viewer) return print({ text: "cd: me: you're a guest. `login` first.", tone: "warn" });
        setCwd(target);
        const e = eventAt(d!, target);
        if (e) print({ text: `${e.title} · ${(PHASE_TAG[e.phase] ?? ["?"])[0]} · ${fmtDate(e.startDate)}  (cat for details)`, tone: "dim" });
        break;
      }

      case "tree": {
        const walk = (p: string[], prefix: string) => {
          const kids = children(d!, p);
          kids.forEach((k, i) => {
            const last = i === kids.length - 1;
            print({ text: `${prefix}${last ? "└── " : "├── "}${k.name}${k.dir ? "/" : ""}`, tone: k.dir ? "dir" : "out" });
            if (k.dir && p.length < 2) walk([...p, k.name], prefix + (last ? "    " : "│   "));
          });
        };
        print({ text: "~", tone: "dir" });
        walk([], "");
        break;
      }

      case "cat":
      case "less":
      case "more": {
        if (arg === "README" || (!arg && cwd.length === 0)) {
          print(
            { text: "codevents: hackathons, talks & workshops by CODES (Computer Debugger's Society), UM Tagum College." },
            { text: "sign in with your @umindanao.edu.ph Google account, register, show your QR at the door, get a certificate." },
            { text: "built by students. found a bug? that's kind of our whole thing.", tone: "dim" }
          );
          break;
        }
        const here = eventAt(d!, cwd);
        if (here && (!arg || arg === "info.txt")) return print(...infoLines(here, ticketFor(d!, here.id)));
        if (here && arg === "winners.txt") {
          here.winners.sort((a, b) => a.place - b.place).forEach((w) => print({ text: `${MEDAL[w.place]} ${w.name}`, tone: "warn" }));
          break;
        }
        if (here && arg === "ticket.qr") return run("ticket");
        if (here && arg === "team.txt") return run("team");
        const e = targetEvent(d!, arg);
        if (!e) return print({ text: `cat: ${arg || "."}: No such file or directory`, tone: "err" });
        print(...infoLines(e, ticketFor(d!, e.id)));
        break;
      }

      case "gui":
      case "open": {
        const target = arg ? resolve(d!, arg) : cwd;
        if (!target) return print({ text: `gui: no such path: ${arg}`, tone: "err" });
        const href = guiHref(d!, target);
        print({ text: `→ ${href}`, tone: "dim" });
        router.push(href);
        setTty(false);
        setTimeout(() => setOpen(false), 150);
        break;
      }

      case "register": {
        if (!d!.viewer) {
          print({ text: "register: you're a guest. `login` first.", tone: "warn" });
          break;
        }
        if (!d!.viewer.profileComplete) {
          print({ text: 'register: set your course and year first → profile --course "BS Computer Science" --year "2nd Year"', tone: "warn" });
          break;
        }
        const flagIdx = args.findIndex((a) => a === "--team" || a === "--join");
        const eventArg = (flagIdx === -1 ? args : args.slice(0, flagIdx)).join(" ") || undefined;
        const e = targetEvent(d!, eventArg) ?? (!eventArg ? d!.upcoming.find((x) => x.phase === "REGISTRATION_OPEN") ?? null : null);
        if (!e) return print({ text: "register: which event? `cd` into one, or `register <name>`", tone: "warn" });
        if (ticketFor(d!, e.id)) return print({ text: `register: you're already in ${e.title}. \`ticket\` shows your QR.`, tone: "dim" });
        if (e.phase !== "REGISTRATION_OPEN") return print({ text: `register: ${e.title} isn't open (${(PHASE_TAG[e.phase] ?? ["?"])[0]}).`, tone: "warn" });
        let team: { mode: "create"; name: string } | { mode: "join"; code: string } | undefined;
        if (e.participation === "TEAM") {
          const flag = flagIdx === -1 ? null : args[flagIdx];
          const val = flagIdx === -1 ? "" : args.slice(flagIdx + 1).join(" ");
          if (!flag || !val) {
            return print(
              { text: `register: ${e.title} is a team event (${e.teamMin}-${e.teamMax} per team).`, tone: "warn" },
              { text: '  register --team "Your Team Name"   create a team', tone: "out" },
              { text: "  register --join ABC123            join with a code", tone: "out" }
            );
          }
          team = flag === "--team" ? { mode: "create", name: val } : { mode: "join", code: val };
        }
        setBusy(true);
        print({ text: `registering for ${e.title}…`, tone: "dim" });
        const res = await registerForEvent(e.id, team);
        setBusy(false);
        if (!res.ok) return print({ text: `register: ${res.error}`, tone: "err" });
        print({ text: `✓ ${res.message}`, tone: "ok" });
        const fresh = await load();
        router.refresh();
        const t = fresh ? ticketFor(fresh, e.id) : null;
        if (t?.team) print({ text: `team ${t.team.name} · invite code ${t.team.code}`, tone: "accent" });
        print({ text: "run `ticket` for your QR.", tone: "dim" });
        break;
      }

      case "cancel": {
        const e = targetEvent(d!, arg || undefined);
        if (!e) return print({ text: "cancel: which event? `cd` into one first.", tone: "warn" });
        if (!ticketFor(d!, e.id)) return print({ text: `cancel: you're not registered for ${e.title}.`, tone: "dim" });
        if (args[args.length - 1] !== "-y" && args[args.length - 1] !== "--yes") {
          return print(
            { text: `this drops your spot in ${e.title}${e.participation === "TEAM" ? " and removes you from your team" : ""}.`, tone: "warn" },
            { text: "run `cancel -y` to confirm.", tone: "out" }
          );
        }
        setBusy(true);
        const res = await cancelRegistration(e.id);
        setBusy(false);
        if (!res.ok) return print({ text: `cancel: ${res.error}`, tone: "err" });
        print({ text: `✓ ${res.message}`, tone: "ok" });
        await load();
        router.refresh();
        break;
      }

      case "ticket":
      case "qr": {
        const e = targetEvent(d!, arg || undefined) ?? (() => {
          const next = d!.tickets.map((t) => d!.upcoming.find((x) => x.id === t.eventId)).find(Boolean);
          return next ?? null;
        })();
        if (!e) return print({ text: "ticket: no upcoming tickets. `cd ~/events` to find something.", tone: "dim" });
        const t = ticketFor(d!, e.id);
        if (!t) return print({ text: `ticket: you're not registered for ${e.title}.`, tone: "warn" });
        // Inline image, like kitty/iTerm image protocols: a text QR doesn't scan reliably.
        const svg = await QRCode.toString(t.qr, { type: "svg", margin: 2, errorCorrectionLevel: "M", color: { dark: "#0a0a0a", light: "#ffffff" } });
        print(
          { text: `${e.title} · ${fmtFull(e.startDate)}`, tone: "accent" },
          { text: "", svg },
          { text: t.checkedIn ? "✓ checked in" : "show this at the entrance. officers scan it.", tone: t.checkedIn ? "ok" : "dim" }
        );
        break;
      }

      case "team": {
        const e = targetEvent(d!, arg || undefined);
        const t = e ? ticketFor(d!, e.id) : null;
        if (!e || !t?.team) return print({ text: "team: you're not on a team here.", tone: "dim" });
        print(
          { text: `team ${t.team.name}  (${t.team.members.length}/${e.teamMax})`, tone: "accent" },
          ...t.team.members.map((m, i) => ({ text: `  ${i === 0 ? "👑" : "· "} ${m}` })),
          { text: `invite code: ${t.team.code}   (teammates run: register --join ${t.team.code})`, tone: "warn" }
        );
        break;
      }

      case "winners":
      case "hof": {
        const withWinners = d!.past.filter((e) => e.winners.length);
        if (withWinners.length === 0) return print({ text: "no winners yet. could be you.", tone: "dim" });
        for (const e of withWinners) {
          print({ text: e.title, tone: "accent" });
          e.winners.sort((a, b) => a.place - b.place).forEach((w) => print({ text: `  ${MEDAL[w.place]} ${w.name}`, tone: "warn" }));
        }
        break;
      }

      case "whoami": {
        if (!d!.viewer) return print({ text: "guest", tone: "out" }, { text: "→ `login` to sign in with your school account", tone: "dim" });
        print(
          { text: d!.viewer.name, tone: "accent" },
          { text: d!.viewer.email, tone: "dim" },
          ...(d!.viewer.course ? [{ text: `${d!.viewer.course} · ${d!.viewer.yearLevel}` }] : []),
          { text: `groups: students${d!.viewer.role ? `, ${d!.viewer.role.toLowerCase()}s` : ""}`, tone: d!.viewer.role ? "ok" : "dim" }
        );
        break;
      }

      case "login": {
        if (d!.viewer) return print({ text: `already signed in as ${d!.viewer.email}`, tone: "dim" });
        print({ text: "opening Google sign-in… use your @umindanao.edu.ph account", tone: "dim" });
        setBusy(true);
        const res = await signInWithGoogle();
        setBusy(false);
        if (!res.ok) return print({ text: `login: ${res.error}`, tone: res.cancelled ? "dim" : "err" });
        const fresh = await load();
        router.refresh();
        print({ text: `✓ signed in as ${fresh?.viewer?.name ?? "you"} (${fresh?.viewer?.email ?? ""})`, tone: "ok" });
        if (fresh?.viewer && !fresh.viewer.profileComplete) {
          print(
            { text: "one more step: set your course and year so you can register.", tone: "warn" },
            { text: '  profile --course "BS Computer Science" --year "2nd Year"', tone: "out" }
          );
        } else {
          print({ text: "next: `cd ~/events` → `ls` → `cd 1` → `register`", tone: "dim" });
        }
        setTimeout(() => inputRef.current?.focus(), 50);
        break;
      }

      case "logout":
        await fetch("/api/session", { method: "DELETE" });
        print({ text: "logged out. bye 👋", tone: "ok" });
        setCwd([]);
        await load();
        router.refresh();
        break;

      case "profile": {
        if (!d!.viewer) return print({ text: "profile: `login` first.", tone: "warn" });
        const flag = (name: string) => {
          const i = args.indexOf(name);
          return i === -1 ? undefined : args[i + 1];
        };
        const course = flag("--course");
        const year = flag("--year");
        if (!course && !year && !flag("--name")) {
          print(
            { text: `${d!.viewer.name} · ${d!.viewer.course ?? "no course"} · ${d!.viewer.yearLevel ?? "no year level"}`, tone: "accent" },
            { text: 'set it here: profile --course "BS Computer Science" --year "3rd Year" [--name "Full Name"]', tone: "dim" },
            { text: "or `gui` style: `profile --edit` opens the form", tone: "dim" }
          );
          if (args.includes("--edit")) {
            go("/onboarding?edit=1");
            setTty(false);
            setOpen(false);
          }
          break;
        }
        setBusy(true);
        const res = await saveProfile({
          name: flag("--name") ?? d!.viewer.name,
          course: course ?? d!.viewer.course ?? "",
          yearLevel: year ?? d!.viewer.yearLevel ?? "",
        });
        setBusy(false);
        if (!res.ok) {
          print({ text: `profile: ${res.fieldErrors ? Object.values(res.fieldErrors).join(" ") : res.error}`, tone: "err" });
          break;
        }
        print({ text: "✓ profile saved.", tone: "ok" });
        await load();
        router.refresh();
        break;
      }

      case "tty":
        setTty((v) => !v);
        print({ text: tty ? "tty off: the shell closes when you open pages." : "tty on: full-screen, stays open. `tty` again to leave.", tone: "ok" });
        break;

      case "neofetch":
      case "fastfetch": {
        const up = d?.upcoming.length ?? 0;
        const done = d?.past.length ?? 0;
        const signups = d ? [...d.upcoming, ...d.past].reduce((n, e) => n + e.count, 0) : 0;
        const art = ["   ▄▄▄▄▄▄▄   ", "  █ ▄▄▄▄▄ █  ", "  █ █ ◉ █ █  ", "  █ █▄▄▄█ █  ", "  █▄▄▄▄▄▄▄█  ", "   ▀▀ ▀ ▀▀   ", "             "];
        const info = [
          `${d?.viewer?.name?.split(" ")[0]?.toLowerCase() ?? "guest"}@codevents`,
          "──────────────────",
          "OS: CODES OS (UM Tagum)",
          "Kernel: Next.js 15 + Firebase",
          `Events: ${up} upcoming, ${done} done`,
          `Sign-ups: ${signups}`,
          `Tickets: ${d?.tickets.length ?? 0}`,
        ];
        art.forEach((a, i) => print({ text: `${a}  ${info[i] ?? ""}`, tone: i === 0 ? "accent" : "out" }));
        break;
      }

      case "date":
        print({ text: new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "full", timeStyle: "long" }) });
        break;
      case "echo":
        print({ text: arg });
        break;
      case "history":
        nextHistory.forEach((h, i) => print({ text: `${String(i + 1).padStart(4)}  ${h}`, tone: "dim" }));
        break;
      case "clear":
      case "cls":
        setLines([]);
        break;
      case "exit":
      case "quit":
      case ":q":
      case ":wq":
        setTty(false);
        setOpen(false);
        break;

      // ---- easter eggs -------------------------------------------------
      case "sudo":
        if (/rm\s+-rf/.test(arg)) {
          setShake(true);
          setTimeout(() => setShake(false), 600);
          print({ text: "rm: refusing to remove '/': the CODES server is load-bearing.", tone: "err" });
        } else if (arg.startsWith("make me a sandwich")) {
          print({ text: "okay. 🥪", tone: "ok" });
        } else {
          print(
            { text: `[sudo] password for ${d?.viewer?.name?.split(" ")[0]?.toLowerCase() ?? "guest"}: ********`, tone: "dim" },
            { text: "you are not in the sudoers file. this incident will be reported to the CODES president.", tone: "err" }
          );
        }
        break;
      case "rm":
        setShake(true);
        setTimeout(() => setShake(false), 600);
        print({ text: "rm: nice try.", tone: "err" });
        break;
      case "debug":
      case "bugs":
        window.dispatchEvent(new Event("codevents:bugs"));
        print({ text: "🐞 debug mode: squash the bugs before they reach production.", tone: "warn" });
        setTty(false);
        setTimeout(() => setOpen(false), 600);
        break;
      case "coffee":
      case "brew":
        print(
          { text: "      ( (", tone: "dim" },
          { text: "       ) )", tone: "dim" },
          { text: "    .______.", tone: "warn" },
          { text: "    |      |]", tone: "warn" },
          { text: "    \\      /", tone: "warn" },
          { text: "     `----'", tone: "warn" },
          { text: "418: I'm a teapot. coffee is at the hackathon.", tone: "dim" }
        );
        break;
      case "hack":
      case "hackerman": {
        const frames = ["bypassing firewall…", "decrypting mainframe…", "downloading more RAM…", "compiling coffee…", "access granted ✓"];
        frames.forEach((f, i) => setTimeout(() => print({ text: f, tone: i === frames.length - 1 ? "ok" : "accent" }), i * 380));
        setTimeout(() => print({ text: "(just kidding. join the hackathon instead: `register`)", tone: "dim" }), frames.length * 380 + 200);
        break;
      }
      case "vim":
      case "vi":
      case "nano":
      case "emacs":
        print({ text: `${cmd}: opening… just kidding. type \`exit\` to escape (you're welcome).`, tone: "dim" });
        break;
      case "git":
        print(
          arg.startsWith("blame")
            ? { text: "it was the intern.", tone: "warn" }
            : { text: "fatal: not a git repository (or any of the parent directories): .codes", tone: "err" }
        );
        break;
      case "hello":
      case "hi":
        print({ text: "hello, world 👋", tone: "ok" });
        break;
      case "42":
        print({ text: "the answer. but what was the question?", tone: "accent" });
        break;

      default:
        print({ text: `${cmdRaw}: command not found. try \`help\``, tone: "err" });
    }
  }

  // ---- input handling ----
  function complete() {
    const parts = input.split(/\s+/);
    if (parts.length <= 1) {
      const matches = COMMANDS.filter((c) => c.startsWith(parts[0].toLowerCase()));
      if (matches.length === 1) setInput(matches[0] + " ");
      else if (matches.length > 1) print({ text: matches.join("  "), tone: "dim" });
      return;
    }
    if (!data) return;
    const last = parts[parts.length - 1];
    const base = last.includes("/") ? last.slice(0, last.lastIndexOf("/") + 1) : "";
    const frag = last.slice(base.length);
    const dir = base ? resolve(data, base) : cwd;
    if (!dir) return;
    const names = children(data, dir)
      .map((k) => k.name + (k.dir ? "/" : ""))
      .filter((n) => n.startsWith(frag));
    if (names.length === 1) setInput([...parts.slice(0, -1), base + names[0]].join(" "));
    else if (names.length > 1) print({ text: names.join("  "), tone: "dim" });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      if (busy) return;
      const v = input;
      setInput("");
      setHIndex(null);
      run(v);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const i = hIndex === null ? history.length - 1 : Math.max(0, hIndex - 1);
      setHIndex(i);
      setInput(history[i]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hIndex === null) return;
      const i = hIndex + 1;
      if (i >= history.length) {
        setHIndex(null);
        setInput("");
      } else {
        setHIndex(i);
        setInput(history[i]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      complete();
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    } else if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      print({ text: `codes@codevents:${pathStr(cwd)}$ ${input}^C`, tone: "dim" });
      setInput("");
    }
  }

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex justify-center",
        tty ? "bg-[#05060c]" : "items-end bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      )}
      onMouseDown={() => !tty && setOpen(false)}
    >
      <div
        role="dialog"
        aria-label="CODES terminal"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "flex w-full flex-col overflow-hidden bg-[#07080f]/95 font-mono text-[13px]",
          tty ? "h-full" : "h-[72vh] max-w-3xl rounded-xl border border-white/10 shadow-[0_30px_80px_-20px_rgba(42,74,255,0.6)]",
          shake && "animate-[shake_0.5s]"
        )}
      >
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
          <button onClick={() => { setTty(false); setOpen(false); }} className="size-3 rounded-full bg-red-500/80" aria-label="Close" />
          <span className="size-3 rounded-full bg-amber-400/80" />
          <button onClick={() => setTty((v) => !v)} className="size-3 rounded-full bg-emerald-400/80" aria-label="Toggle full screen" />
          <span className="ml-3 flex-1 truncate text-xs text-neutral-400">
            codes@codevents: {pathStr(cwd)} {tty && <span className="ml-2 rounded bg-emerald-400/15 px-1.5 text-emerald-300">tty</span>}
          </span>
          <button onClick={() => setTty((v) => !v)} className="text-neutral-500 hover:text-neutral-200" aria-label="Toggle full screen">
            {tty ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
          <button onClick={() => { setTty(false); setOpen(false); }} className="text-neutral-500 hover:text-neutral-200" aria-label="Close terminal">
            <X className="size-4" />
          </button>
        </div>
        <div ref={scrollRef} className={cn("scanlines flex-1 overflow-y-auto py-3 leading-relaxed", tty ? "px-[max(1rem,calc((100vw-60rem)/2))]" : "px-4")}>
          {lines.map((l, i) =>
            l.href || l.run ? (
              <button
                key={i}
                onClick={() => {
                  if (l.run) run(l.run);
                  else if (l.href) {
                    router.push(l.href);
                    if (!tty) setOpen(false);
                  }
                }}
                className={cn("block w-full whitespace-pre text-left hover:bg-white/5", TONE[l.tone ?? "out"])}
              >
                {l.text || " "}
              </button>
            ) : l.svg ? (
              <div
                key={i}
                className="my-2 size-48 rounded-md bg-white p-1 [&_svg]:h-full [&_svg]:w-full"
                role="img"
                aria-label="Check-in QR code"
                dangerouslySetInnerHTML={{ __html: l.svg }}
              />
            ) : (
              <div key={i} className={cn("whitespace-pre-wrap break-words", TONE[l.tone ?? "out"])}>
                {l.text || " "}
              </div>
            )
          )}
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-emerald-300">codes@codevents</span>
            <span className="shrink-0 text-blue-300">{pathStr(cwd)}</span>
            <span className="-ml-2 shrink-0 text-neutral-500">$</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              aria-label="Terminal input"
              disabled={busy}
              className="min-w-0 flex-1 bg-transparent text-neutral-100 caret-blue-400 outline-none"
            />
          </div>
        </div>
        <div className="flex justify-between gap-3 border-t border-white/10 px-4 py-1.5 text-[11px] text-neutral-500">
          <span className="truncate">help · ls · cd · cat · register · ticket · gui · tty</span>
          <span className="shrink-0">{tty ? "`tty` or exit to leave" : "esc to close"}</span>
        </div>
      </div>
    </div>
  );
}
