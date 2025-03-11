import { createHash } from "node:crypto";
import { notFound } from "next/navigation";
import Image from "next/image";
import { requireViewer } from "@/lib/server/auth";
import { getEvent, getRegistration } from "@/lib/server/data";
import { EVENT_TYPE_LABEL, PLACE_LABEL, formatDate, getPhase, isPast } from "@/lib/domain";
import PrintButton from "@/components/site/PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Certificate" };

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireViewer(`/certificates/${id}`);
  const reg = await getRegistration(id);
  if (!reg || (reg.uid !== viewer.user.uid && !viewer.role)) notFound();
  const event = await getEvent(reg.eventId);
  if (!event) notFound();

  const phase = getPhase(event);
  if (!reg.checkedInAt || !isPast(phase)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-chakra text-2xl font-bold">Certificate not available yet</h1>
        <p className="mt-2 text-muted-foreground">
          {!reg.checkedInAt
            ? "Certificates are for attendees who checked in at the venue."
            : "Certificates unlock once the event ends."}
        </p>
      </div>
    );
  }

  const win = event.winners.find((w) => w.refId === reg.id || (reg.teamId && w.refId === reg.teamId));
  const certNo = `CE-${createHash("sha256").update(reg.id).digest("hex").slice(0, 10).toUpperCase().replace(/(.{5})/, "$1-")}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="no-print mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Tip: print or “Save as PDF” in landscape.</p>
        <PrintButton />
      </div>

      <style>{`@page { size: A4 landscape; margin: 0; } @media print { header, footer { display: none !important; } main > div { padding: 0 !important; max-width: none !important; } }`}</style>

      <article className="relative mx-auto aspect-[297/210] w-full overflow-hidden [container-type:inline-size] rounded-xl bg-[#05060f] text-white shadow-2xl print:rounded-none print:shadow-none [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
        <div className="grid-bg absolute inset-0 opacity-70" />
        <div className="absolute -left-24 -top-24 size-96 rounded-full bg-[#2a4aff]/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 size-[28rem] rounded-full bg-[#1d34b3]/30 blur-3xl" />
        <div className="absolute inset-[3%] rounded-lg border border-white/15" />

        <div className="relative flex h-full flex-col items-center justify-center px-[8%] text-center">
          <div className="flex items-center gap-2">
            <Image src="/images/codes.png" alt="" width={28} height={28} className="size-[max(14px,2.6cqw)]" />
            <span className="font-chakra text-[max(7px,1.35cqw)] font-bold tracking-[0.3em]">CODES · UM TAGUM COLLEGE</span>
          </div>
          <p className="mt-[3%] font-chakra text-[max(6px,1.35cqw)] uppercase tracking-[0.4em] text-white/60">
            {win ? "Certificate of Achievement" : "Certificate of Participation"}
          </p>
          <p className="mt-[3%] text-[max(6px,1.3cqw)] text-white/60">This certifies that</p>
          <h1 className="mt-[1.5%] font-chakra text-[5.4cqw] font-bold uppercase leading-none">
            {reg.name}
          </h1>
          <div className="mt-[2%] h-px w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <p className="mt-[2%] max-w-[80%] text-[max(7px,1.6cqw)] text-white/80">
            {win ? (
              <>
                won <span className="font-semibold text-amber-300">{PLACE_LABEL[win.place]}</span>
                {win.members ? <> as part of team <span className="font-semibold text-white">{win.name}</span></> : null} in
              </>
            ) : (
              <>participated in the {EVENT_TYPE_LABEL[event.type].toLowerCase()}</>
            )}
          </p>
          <p className="mt-[1.5%] font-chakra text-[3.6cqw] font-bold uppercase [text-shadow:0.28cqw_0.28cqw_0_#2a4aff,0.56cqw_0.56cqw_0_#1d34b3,0.84cqw_0.84cqw_0_#152580,1.12cqw_1.12cqw_0_#080f33]">{event.title}</p>
          <p className="mt-[2%] text-[max(6px,1.25cqw)] text-white/60">
            held on {formatDate(event.startDate, { month: "long" })} at {event.venue}
          </p>

          <div className="absolute bottom-[7%] left-[8%] right-[8%] flex items-end justify-between text-left text-[max(5px,1.05cqw)] text-white/50">
            <div>
              <p className="font-chakra uppercase tracking-widest">Certificate no.</p>
              <p className="text-white/80">{certNo}</p>
            </div>
            <div className="text-right">
              <p className="font-chakra uppercase tracking-widest">Issued by</p>
              <p className="text-white/80">CODES Officers · {formatDate(event.endDate, { month: "long" })}</p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
