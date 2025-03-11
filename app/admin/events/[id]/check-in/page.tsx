import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getEvent, getRegistrationsForEvent } from "@/lib/server/data";
import CheckInStation from "@/components/admin/CheckInStation";

export const metadata = { title: "Check-in" };

export default async function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();
  const regs = await getRegistrationsForEvent(id);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link href={`/admin/events/${id}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {event.title}
        </Link>
        <h1 className="mt-2 font-chakra text-3xl font-bold">Check-in</h1>
        <p className="text-sm text-muted-foreground">
          Scan each attendee&apos;s QR from their “My events” page. No camera? Search their name below.
        </p>
      </div>
      <CheckInStation
        eventId={id}
        people={regs.map((r) => ({ id: r.id, name: r.name, email: r.email, course: r.course, checkedInAt: r.checkedInAt }))}
      />
    </div>
  );
}
