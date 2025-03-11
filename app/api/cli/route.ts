import { NextResponse } from "next/server";
import { getViewer } from "@/lib/server/auth";
import { getRegistrationsForUser, getTeam, listPublicEvents } from "@/lib/server/data";
import { getPhase, profileNeedsUpdate, qrPayload } from "@/lib/domain";

export const dynamic = "force-dynamic";

/** Data for the in-site terminal: public events plus who's signed in. */
export async function GET() {
  const [{ featured, upcoming, past }, viewer] = await Promise.all([listPublicEvents(), getViewer()]);
  const now = new Date();
  const toRow = (e: NonNullable<typeof featured>) => ({
    id: e.id,
    title: e.title,
    tagline: e.tagline,
    type: e.type,
    phase: getPhase(e, now),
    startDate: e.startDate,
    endDate: e.endDate,
    teamMin: e.teamMin,
    teamMax: e.teamMax,
    description: e.description,
    venue: e.venue,
    count: e.registrationCount,
    capacity: e.capacity,
    participation: e.participation,
    winners: e.winners.map((w) => ({ place: w.place, name: w.name })),
  });
  const regs = viewer ? await getRegistrationsForUser(viewer.user.uid) : [];
  const tickets = await Promise.all(
    regs.map(async (r) => {
      const team = r.teamId ? await getTeam(r.teamId) : null;
      return {
        eventId: r.eventId,
        regId: r.id,
        qr: qrPayload(r),
        checkedIn: !!r.checkedInAt,
        team: team ? { name: team.name, code: team.code, members: team.memberNames } : null,
      };
    })
  );
  return NextResponse.json({
    tickets,
    upcoming: [...(featured ? [featured] : []), ...upcoming].map(toRow),
    past: past.map(toRow),
    viewer: viewer
      ? {
          name: viewer.profile?.name || viewer.user.name,
          email: viewer.user.email,
          course: viewer.profile?.course ?? null,
          yearLevel: viewer.profile?.yearLevel ?? null,
          role: viewer.role,
          profileComplete: !profileNeedsUpdate(viewer.profile),
        }
      : null,
  });
}
