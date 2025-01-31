"use client";

import { participantSchema } from "@/lib/validation";
import { useActionState, useEffect, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { addParticipant } from "@/lib/actions/participant.action";
import { Participant } from "@/types/types";

export default function ParticipantForm({
  eventId,
  handleAddParticipant,
}: {
  eventId: string;
  handleAddParticipant: (newParticipant: Participant) => void;
}) {
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

  useEffect(() => {
    if (state.success) {
      handleAddParticipant({
        id: form.getValues()["email"],
        name: form.getValues()["name"],
        email: form.getValues()["email"],
        eventId: eventId,
        yearLevel: form.getValues()["yearLevel"],
      });
    }
  }, [state.success]);

  const isValid = form.formState.isValid;
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <div className="rounded-lg border-white border-[1px] p-10 font-primary flex flex-col gap-4">
      <h2 className="text-3xl">REGISTER NOW</h2>
      <Form {...form}>
        <form
          className="flex flex-col gap-4"
          ref={formRef}
          action={(data) => {
            form.trigger();
            if (!isValid) return;
            submitParticipant(data);
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
            name="yearLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year Level</FormLabel>
                <FormControl>
                  <div className="">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      {...field}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Year Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st">1st Year</SelectItem>
                        <SelectItem value="2nd">2nd Year</SelectItem>
                        <SelectItem value="3rd">3rd Year</SelectItem>
                        <SelectItem value="4th">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </FormControl>
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
          <Button type="submit">{isPending ? "Loading..." : "Register"}</Button>
        </form>
      </Form>
    </div>
  );
}
