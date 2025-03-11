import { brandOg, OG_SIZE } from "@/lib/og";
import { EVENT_TYPE_LABEL, formatDate } from "@/lib/domain";
import { getEvent } from "@/lib/server/data";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "codevents event";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
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
