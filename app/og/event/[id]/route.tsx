import { brandOg } from "@/lib/og";
import { EVENT_TYPE_LABEL, formatDate } from "@/lib/domain";
import { getEvent } from "@/lib/server/data";

/** Link-preview image for an event (1200×630), referenced from the event page's metadata. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event || event.status === "DRAFT") {
    return brandOg({ title: "codevents", kicker: "CODES · UM Tagum" });
  }
  const part = (o: Intl.DateTimeFormatOptions) => formatDate(event.startDate, { month: undefined, day: undefined, year: undefined, ...o }).toUpperCase();
  return brandOg({
    title: event.title,
    tagline: event.tagline,
    kicker: EVENT_TYPE_LABEL[event.type],
    date: { month: part({ month: "short" }), day: part({ day: "numeric" }), wd: part({ weekday: "short" }) },
  });
}
