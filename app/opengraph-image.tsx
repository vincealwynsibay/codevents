import { brandOg, OG_SIZE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "codevents: hackathons, talks and workshops by CODES, UM Tagum";

export default function Image() {
  return brandOg({
    title: "Build. Ship. Show up.",
    tagline: "Hackathons, talks and workshops by CODES, UM Tagum's computing society.",
    kicker: "CODES · UM Tagum",
  });
}
