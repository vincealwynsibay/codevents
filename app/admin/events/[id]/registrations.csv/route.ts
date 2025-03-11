import { getViewer } from "@/lib/server/auth";
import { getEvent, getRegistrationsForEvent, getTeamsForEvent } from "@/lib/server/data";

function manila(iso: string | null) {
  if (!iso) return "";
  // "2026-11-26 13:05" in Philippine time (UTC+8, no DST)
  return new Date(new Date(iso).getTime() + 8 * 3600 * 1000).toISOString().slice(0, 16).replace("T", " ");
}

function cell(value: string | null | undefined) {
  const s = value ?? "";
  // Guard against spreadsheet formula injection, then quote.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer?.role) return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return new Response("Not found", { status: 404 });
  const [regs, teams] = await Promise.all([getRegistrationsForEvent(id), getTeamsForEvent(id)]);
  const teamName = (tid: string | null) => teams.find((t) => t.id === tid)?.name ?? "";

  const header = ["Name", "Email", "Course", "Year level", "Team", "Signed up (PH time)", "Checked in (PH time)"];
  const lines = [
    header.map(cell).join(","),
    ...regs
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((r) =>
        [r.name, r.email, r.course, r.yearLevel, teamName(r.teamId), manila(r.createdAt), manila(r.checkedInAt)].map(cell).join(",")
      ),
  ];
  const slug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug || "event"}-participants.csv"`,
    },
  });
}
