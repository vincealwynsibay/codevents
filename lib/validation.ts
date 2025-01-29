import { isAfter, isEqual, parseISO } from "date-fns";
import z from "zod";

export const eventSchema = z.object({
  name: z.string().nonempty(),
  description: z.string().nonempty(),
  // start date must be equal or greater than current date
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.string().nullable().default("UPCOMING"),
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
    .refine((value) => value.trimEnd().split("@")[1] == "umindanao.edu.ph", {
      message: "Email must be a valid umindanao.edu.ph",
    }),
  eventId: z.string().nonempty(),
});
