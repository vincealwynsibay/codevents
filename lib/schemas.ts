import { z } from "zod";
import { EVENT_TYPES } from "@/lib/domain";

const imageUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((s) => s === "" || s.startsWith("/") || /^https?:\/\//.test(s), "Must be a link (https://…).")
  .transform((s) => (s === "" ? null : s))
  .nullable();

const isoDate = z.string().datetime({ offset: true, message: "Pick a date and time." });

const prizeSchema = z.object({
  place: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  title: z.string().trim().min(1, "Prize needs a title.").max(80),
  description: z.string().trim().max(300).default(""),
  imageUrl,
});

export const eventInputSchema = z
  .object({
    title: z.string().trim().min(3, "At least 3 characters.").max(100),
    tagline: z.string().trim().max(140).default(""),
    description: z.string().trim().min(1, "Describe the event.").max(5000),
    type: z.enum(EVENT_TYPES),
    venue: z.string().trim().min(1, "Where is it happening?").max(200),
    coverImageUrl: imageUrl,
    startDate: isoDate,
    endDate: isoDate,
    registrationDeadline: isoDate.nullable(),
    capacity: z.number().int().positive("Must be at least 1.").max(100000).nullable(),
    participation: z.enum(["SOLO", "TEAM"]),
    teamMin: z.number().int().min(1).max(20),
    teamMax: z.number().int().min(1).max(20),
    prizes: z.array(prizeSchema).max(3),
  })
  .superRefine((v, ctx) => {
    if (new Date(v.endDate) <= new Date(v.startDate)) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "Must end after it starts." });
    }
    if (v.registrationDeadline && new Date(v.registrationDeadline) > new Date(v.startDate)) {
      ctx.addIssue({
        code: "custom",
        path: ["registrationDeadline"],
        message: "Deadline must be before the event starts.",
      });
    }
    if (v.participation === "TEAM" && v.teamMin > v.teamMax) {
      ctx.addIssue({ code: "custom", path: ["teamMax"], message: "Max must be ≥ min." });
    }
    const places = v.prizes.map((p) => p.place);
    if (new Set(places).size !== places.length) {
      ctx.addIssue({ code: "custom", path: ["prizes"], message: "Each place can only have one prize." });
    }
  });

export type EventInput = z.input<typeof eventInputSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  course: z.string().trim().min(1, "Pick your course.").max(80),
  yearLevel: z.string().trim().min(1, "Pick your year level.").max(20),
});
