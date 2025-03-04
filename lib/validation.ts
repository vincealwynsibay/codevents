import { isAfter, isEqual, parseISO } from "date-fns";
import z from "zod";

export const eventSchema = z.object({
  name: z.string().nonempty(),
  description: z.string().nonempty(),
  // start date must be equal or greater than current date
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.string().nullable().default("UPCOMING"),
  isActive: z.boolean().default(false),
  isCompleted: z.boolean().default(false),
  winner1: z.string().nullable().default(""),
  winner2: z.string().nullable().default(""),
  winner3: z.string().nullable().default(""),
  prize1: z.string().nonempty(),
  prize2: z.string().nonempty(),
  prize3: z.string().nonempty(),
  prizeDescription1: z.string().nonempty(),
  prizeDescription2: z.string().nonempty(),
  prizeDescription3: z.string().nonempty(),
});

export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export const refinedEventSchema = eventSchema.refine(
  (data) =>
    isEqual(parseISO(data.endDate), parseISO(data.startDate)) ||
    isAfter(parseISO(data.endDate), parseISO(data.startDate)),
  {
    message: "End date cannot be earlier than start date.",
    path: ["endDate"],
  }
);

export const existingEventSchema = eventSchema.extend({ id: z.string() });
export const refinedExistingEventSchema = existingEventSchema.refine(
  (data) =>
    isEqual(parseISO(data.endDate), parseISO(data.startDate)) ||
    isAfter(parseISO(data.endDate), parseISO(data.startDate)),
  {
    message: "End date cannot be earlier than start date.",
    path: ["endDate"],
  }
);

export type EventPayload = z.infer<typeof eventSchema>;

export const participantSchema = z.object({
  name: z.string().nonempty(),
  email: z
    .string()
    .email()
    // validate this format v.sibay.139673.tc@umindanao.edu.ph
    .refine(
      (value) =>
        /^[a-zA-Z]+\.[a-zA-Z]+\.\d{6}\.tc@umindanao\.edu\.ph$/.test(value),
      {
        message: "Email must be a valid umindanao.edu.ph",
      }
    ),
  eventId: z.string().nonempty(),
  yearLevel: z.string().nonempty(),
  course: z.string().nonempty(),
});
