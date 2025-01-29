"use client";

import { participantSchema } from "@/lib/validation";
import { useActionState, useRef } from "react";
import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { addParticipant } from "@/lib/actions/participant.action";

export default function ParticipantForm({ eventId }: { eventId: string }) {
  const [state, submitParticipant, isPending] = useActionState(addParticipant, {
    message: "",
  });

  const router = useRouter();

  const form = useForm<z.output<typeof participantSchema>>({
    resolver: zodResolver(participantSchema),
    defaultValues: {
      name: "",
      email: "",
      eventId: eventId,
    },
  });

  const isValid = form.formState.isValid;
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <Form {...form}>
      <form
        className=""
        ref={formRef}
        action={(data) => {
          form.trigger();
          console.log(data, form.getValues());
          if (!isValid) return;
          const res = submitParticipant(data);
          console.log("res", res);
          router.refresh();
        }}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="johndoe@umindanao.edu.ph"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Use a valid umindanao.edu.ph email
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="eventId"
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          render={({ field: { value, ...fieldProps } }) => (
            <FormItem>
              <FormControl>
                <Input type="hidden" value={eventId} {...fieldProps} />
              </FormControl>
            </FormItem>
          )}
        />
        {state.message && <FormMessage>{state.message}</FormMessage>}
        <Button type="submit">
          {isPending ? "Loading..." : "Create Novel"}
        </Button>
      </form>
    </Form>
  );
}
