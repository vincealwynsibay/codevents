import Link from "next/link";
import { Plus } from "lucide-react";
import { listAllEvents } from "@/lib/server/data";
import { EVENT_TYPE_LABEL, formatDateTime, getPhase } from "@/lib/domain";
import PhaseBadge from "@/components/events/PhaseBadge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Manage events" };

export default async function AdminEventsPage() {
  const events = await listAllEvents();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Events</p>
          <h1 className="mt-1 font-chakra text-3xl font-bold">All events</h1>
        </div>
        <Button asChild className="font-chakra tracking-wide">
          <Link href="/admin/events/new">
            <Plus /> New event
          </Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="panel px-6 py-16 text-center text-muted-foreground">
          No events yet.{" "}
          <Link href="/admin/events/new" className="text-blue-300 hover:underline">
            Create the first one
          </Link>
          .
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Event</th>
                <th className="p-3 font-medium">Starts</th>
                <th className="p-3 font-medium">Sign-ups</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {events.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="p-3">
                    <Link href={`/admin/events/${e.id}`} className="font-medium hover:text-blue-200">
                      {e.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {EVENT_TYPE_LABEL[e.type]} · {e.participation === "TEAM" ? "Teams" : "Solo"}
                    </p>
                  </td>
                  <td className="p-3 text-muted-foreground">{formatDateTime(e.startDate)}</td>
                  <td className="p-3 tabular-nums">
                    {e.registrationCount}
                    {e.capacity !== null && <span className="text-muted-foreground">/{e.capacity}</span>}
                  </td>
                  <td className="p-3">
                    <PhaseBadge phase={getPhase(e)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
