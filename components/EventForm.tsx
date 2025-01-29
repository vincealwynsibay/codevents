"use client";

import { createEvent } from "@/lib/actions/event.action";
import { refinedEventSchema } from "@/lib/validation";
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
import { Textarea } from "./ui/textarea";
import { DateTimePicker } from "./ui/datetimepicker";
import { parseISO } from "date-fns";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export default function EventForm({ serverDate }: { serverDate: Date }) {
  const [state, submitEvent, isPending] = useActionState(createEvent, {
    message: "",
  });

  const router = useRouter();

  const form = useForm<z.output<typeof refinedEventSchema>>({
    resolver: zodResolver(refinedEventSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: serverDate.toISOString(),
      endDate: serverDate.toISOString(),
      status: "",
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
          if (!isValid) return;
          submitEvent(data);
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
                <Input placeholder="hackathon2025" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Textarea placeholder="hackathon2025" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="startDate"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Start Datetime</FormLabel>
              <FormControl>
                <div className="">
                  <DateTimePicker
                    value={parseISO(value)}
                    onChange={(date) => date && onChange(date?.toISOString())}
                    {...fieldProps}
                  />
                  <Input type="hidden" value={value} {...fieldProps} />
                </div>
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>End Datetime</FormLabel>
              <FormControl>
                <div className="">
                  <DateTimePicker
                    value={parseISO(value)}
                    onChange={(date) => date && onChange(date?.toISOString())}
                    {...fieldProps}
                  />
                  <Input type="hidden" value={value} {...fieldProps} />
                </div>
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
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
