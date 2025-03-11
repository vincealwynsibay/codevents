import { notFound } from "next/navigation";
import Poster, { FORMATS, PosterFormat } from "@/components/brand/Poster";
import { BrandDir } from "@/components/brand/Logo";
import { getEvent } from "@/lib/server/data";
import { eventUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Poster", robots: { index: false } };

/**
 * Render target for exports: the poster sits at (0,0) at its exact pixel size, over everything else,
 * so `google-chrome --headless --screenshot --window-size=WxH <url>` captures just the poster.
 */
export default async function PosterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ d?: string; f?: string }>;
}) {
  const [{ id }, { d, f }] = await Promise.all([params, searchParams]);
  const event = await getEvent(id);
  if (!event) notFound();
  const dir: BrandDir = d === "b" ? "b" : "a";
  const format: PosterFormat = f && f in FORMATS ? (f as PosterFormat) : "post";

  return (
    <div className="fixed left-0 top-0 z-[200]">
      <Poster dir={dir} format={format} event={event} url={eventUrl(event.id)} />
    </div>
  );
}
