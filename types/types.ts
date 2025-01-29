import { EventPayload } from "@/lib/validation";

export type FormState = {
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields?: Record<string, any>;
  success?: boolean;
};

export type Event = {
  id: string;
} & EventPayload;

export type Participant = {
  id: string;
  name: string;
  email: string;
  eventId: string;
};
