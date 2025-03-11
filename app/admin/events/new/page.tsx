import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EventForm from "@/components/admin/EventForm";

export const metadata = { title: "New event" };

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/events" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Events
        </Link>
        <h1 className="mt-2 font-chakra text-3xl font-bold">New event</h1>
        <p className="text-sm text-muted-foreground">It starts as a draft. Only officers can see it until you open registration.</p>
      </div>
      <EventForm />
    </div>
  );
}
