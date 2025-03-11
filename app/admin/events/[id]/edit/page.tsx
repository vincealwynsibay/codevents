import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getEvent } from "@/lib/server/data";
import EventForm from "@/components/admin/EventForm";

export const metadata = { title: "Edit event" };

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();
  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/events/${id}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {event.title}
        </Link>
        <h1 className="mt-2 font-chakra text-3xl font-bold">Edit event</h1>
      </div>
      <EventForm event={event} />
    </div>
  );
}
