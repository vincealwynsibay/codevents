"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trophy, Upload, X } from "lucide-react";
import { saveEvent } from "@/lib/actions/events";
import { uploadImage } from "@/lib/actions/upload";
import type { EventInput } from "@/lib/schemas";
import { CodEvent, EVENT_TYPES, EVENT_TYPE_LABEL, PLACE_LABEL, Place } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Field, NativeSelect, TextArea, TextInput } from "@/components/form/fields";
import { toast } from "@/hooks/use-toast";
import EventCover from "@/components/events/EventCover";
import { cn } from "@/lib/utils";

// All times are entered in Philippine time (UTC+8, no DST), whatever the browser's timezone.
const OFFSET = "+08:00";
function toInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 8 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}
function fromInput(value: string) {
  return value ? new Date(`${value}:00${OFFSET}`).toISOString() : null;
}

type PrizeDraft = { enabled: boolean; title: string; description: string; imageUrl: string };

const DEFAULT_PRIZE_IMAGES: Record<Place, string> = {
  1: "/images/1st.png",
  2: "/images/2nd.png",
  3: "/images/3rd.png",
};

export default function EventForm({ event }: { event?: CodEvent }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [v, setV] = useState({
    title: event?.title ?? "",
    tagline: event?.tagline ?? "",
    description: event?.description ?? "",
    type: event?.type ?? "CONTEST",
    venue: event?.venue ?? "",
    coverImageUrl: event?.coverImageUrl ?? "",
    start: toInput(event?.startDate ?? null),
    end: toInput(event?.endDate ?? null),
    deadline: toInput(event?.registrationDeadline ?? null),
    capacity: event?.capacity ? String(event.capacity) : "",
    participation: event?.participation ?? "SOLO",
    teamMin: String(event?.teamMin ?? 2),
    teamMax: String(event?.teamMax ?? 4),
  });
  const [hasPrizes, setHasPrizes] = useState(event ? event.prizes.length > 0 : true);
  const [prizes, setPrizes] = useState<Record<Place, PrizeDraft>>(() => {
    const init = {} as Record<Place, PrizeDraft>;
    ([1, 2, 3] as Place[]).forEach((place) => {
      const p = event?.prizes.find((x) => x.place === place);
      init[place] = {
        enabled: event ? !!p : true,
        title: p?.title ?? "",
        description: p?.description ?? "",
        imageUrl: p?.imageUrl ?? "",
      };
    });
    return init;
  });

  const set = (patch: Partial<typeof v>) => setV((prev) => ({ ...prev, ...patch }));
  const setPrize = (place: Place, patch: Partial<PrizeDraft>) =>
    setPrizes((prev) => ({ ...prev, [place]: { ...prev[place], ...patch } }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const input: EventInput = {
      title: v.title,
      tagline: v.tagline,
      description: v.description,
      type: v.type,
      venue: v.venue,
      coverImageUrl: v.coverImageUrl || null,
      startDate: fromInput(v.start) ?? "",
      endDate: fromInput(v.end) ?? "",
      registrationDeadline: fromInput(v.deadline),
      capacity: v.capacity ? Number(v.capacity) : null,
      participation: v.participation,
      teamMin: Number(v.teamMin) || 1,
      teamMax: Number(v.teamMax) || 1,
      prizes: hasPrizes
        ? ([1, 2, 3] as Place[])
            .filter((place) => prizes[place].enabled)
            .map((place) => ({
              place,
              title: prizes[place].title,
              description: prizes[place].description,
              imageUrl: prizes[place].imageUrl || null,
            }))
        : [],
    };
    start(async () => {
      const res = await saveEvent(event?.id ?? null, input);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setErrors({});
      toast({ title: res.message });
      router.push(`/admin/events/${res.data!.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {formError && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-red-300">
          {formError}
        </p>
      )}

      <Section title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" error={errors.title} className="sm:col-span-2">
            <TextInput value={v.title} onChange={(e) => set({ title: e.target.value })} placeholder="CODES Hackathon 2026" />
          </Field>
          <Field label="Tagline" error={errors.tagline} hint="One line shown on cards." className="sm:col-span-2">
            <TextInput value={v.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="24 hours. One problem. Your best build." />
          </Field>
          <Field label="Type" error={errors.type}>
            <NativeSelect value={v.type} onChange={(e) => set({ type: e.target.value as CodEvent["type"] })}>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {EVENT_TYPE_LABEL[t]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Venue" error={errors.venue}>
            <TextInput value={v.venue} onChange={(e) => set({ venue: e.target.value })} placeholder="CL3, UM Tagum College" />
          </Field>
          <Field label="Description" error={errors.description} className="sm:col-span-2" hint="Mechanics, what to bring, schedule. Line breaks are kept.">
            <TextArea rows={8} value={v.description} onChange={(e) => set({ description: e.target.value })} />
          </Field>
        </div>
      </Section>

      <Section title="Cover image">
        <div className="grid gap-4 sm:grid-cols-[240px_1fr]">
          <EventCover
            event={{ title: v.title || "Event title", type: v.type, coverImageUrl: v.coverImageUrl || null }}
            className="aspect-[16/9] w-full rounded-lg border"
          />
          <ImageField
            value={v.coverImageUrl}
            onChange={(url) => set({ coverImageUrl: url })}
            error={errors.coverImageUrl}
            hint="Optional. Without one, a branded cover is generated from the event type."
          />
        </div>
      </Section>

      <Section title="Schedule (Philippine time)">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Starts" error={errors.startDate}>
            <TextInput type="datetime-local" value={v.start} onChange={(e) => set({ start: e.target.value })} />
          </Field>
          <Field label="Ends" error={errors.endDate}>
            <TextInput type="datetime-local" value={v.end} onChange={(e) => set({ end: e.target.value })} />
          </Field>
          <Field label="Registration deadline" error={errors.registrationDeadline} hint="Optional. Closes sign-ups automatically.">
            <div className="flex gap-2">
              <TextInput type="datetime-local" value={v.deadline} onChange={(e) => set({ deadline: e.target.value })} />
              {v.deadline && (
                <Button type="button" variant="ghost" size="icon" onClick={() => set({ deadline: "" })} aria-label="Clear deadline">
                  <X />
                </Button>
              )}
            </div>
          </Field>
        </div>
      </Section>

      <Section title="Participants">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Capacity" error={errors.capacity} hint="Leave empty for no limit. Counts people, not teams.">
            <TextInput type="number" min={1} value={v.capacity} onChange={(e) => set({ capacity: e.target.value })} placeholder="No limit" />
          </Field>
          <Field label="Format" error={errors.participation}>
            <NativeSelect
              value={v.participation}
              onChange={(e) => set({ participation: e.target.value as "SOLO" | "TEAM" })}
              disabled={!!event && event.registrationCount > 0}
            >
              <option value="SOLO">Solo</option>
              <option value="TEAM">Teams</option>
            </NativeSelect>
          </Field>
          {v.participation === "TEAM" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Min per team" error={errors.teamMin}>
                <TextInput type="number" min={1} max={20} value={v.teamMin} onChange={(e) => set({ teamMin: e.target.value })} />
              </Field>
              <Field label="Max per team" error={errors.teamMax}>
                <TextInput type="number" min={1} max={20} value={v.teamMax} onChange={(e) => set({ teamMax: e.target.value })} />
              </Field>
            </div>
          )}
        </div>
      </Section>

      <Section
        title="Prizes"
        action={
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hasPrizes} onChange={(e) => setHasPrizes(e.target.checked)} className="size-4 accent-[#2a4aff]" />
            This event has prizes
          </label>
        }
      >
        {errors.prizes && <p className="mb-3 text-xs text-red-400">{errors.prizes}</p>}
        {hasPrizes ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {([1, 2, 3] as Place[]).map((place, idx) => {
              const p = prizes[place];
              return (
                <div key={place} className={cn("rounded-lg border p-4", !p.enabled && "opacity-50")}>
                  <label className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 font-chakra font-bold">
                      <Trophy className="size-4 text-amber-300" /> {PLACE_LABEL[place]}
                    </span>
                    {place !== 1 && (
                      <input
                        type="checkbox"
                        checked={p.enabled}
                        onChange={(e) => setPrize(place, { enabled: e.target.checked })}
                        className="size-4 accent-[#2a4aff]"
                        aria-label={`Enable ${PLACE_LABEL[place]}`}
                      />
                    )}
                  </label>
                  {p.enabled && (
                    <div className="space-y-3">
                      <Field label="Prize" error={errors[`prizes.${idx}.title`]}>
                        <TextInput value={p.title} onChange={(e) => setPrize(place, { title: e.target.value })} placeholder="Mechanical keyboard" />
                      </Field>
                      <Field label="Details">
                        <TextInput value={p.description} onChange={(e) => setPrize(place, { description: e.target.value })} placeholder="+ ₱3,000 cash" />
                      </Field>
                      <ImageField
                        compact
                        value={p.imageUrl}
                        onChange={(url) => setPrize(place, { imageUrl: url })}
                        suggestion={DEFAULT_PRIZE_IMAGES[place]}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No prizes or winners. Good for talks and workshops.</p>
        )}
      </Section>

      <div className="sticky bottom-4 z-10 flex justify-end gap-3 rounded-xl border bg-background/90 p-3 backdrop-blur">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending} className="font-chakra tracking-wide">
          {pending && <Loader2 className="animate-spin" />}
          {event ? "Save changes" : "Create draft"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-chakra font-bold uppercase tracking-wide">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ImageField({
  value,
  onChange,
  error,
  hint,
  compact,
  suggestion,
}: {
  value: string;
  onChange: (url: string) => void;
  error?: string;
  hint?: string;
  compact?: boolean;
  suggestion?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setUploadError(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadImage(fd);
    setUploading(false);
    if (!res.ok) setUploadError(res.error);
    else onChange(res.data!.url);
  }

  return (
    <div className="space-y-2">
      <Field label={compact ? "Image" : "Image link"} error={error ?? uploadError ?? undefined} hint={hint}>
        <div className="flex gap-2">
          <TextInput value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://…" />
          <Button type="button" variant="outline" size="icon" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Upload image">
            {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
          </Button>
        </div>
      </Field>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      {compact && (
        <div className="flex items-center gap-3">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-14 w-auto rounded bg-black/30 object-contain" />
          ) : suggestion ? (
            <button type="button" onClick={() => onChange(suggestion)} className="text-xs text-blue-300 hover:underline">
              Use default image
            </button>
          ) : null}
          {value && (
            <button type="button" onClick={() => onChange("")} className="text-xs text-muted-foreground hover:text-foreground">
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}
