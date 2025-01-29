"use client";

import { refinedExistingEventSchema } from "@/lib/validation";
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
import { Event } from "@/types/types";
import { updateEvent } from "@/lib/actions/event.action";

export default function UpdateEventForm({
  eventData,
  handleUpdate,
}: {
  eventData: Event;
  handleUpdate: () => void;
}) {
  const [state, submitEvent, isPending] = useActionState(updateEvent, {
    message: "",
  });

  const form = useForm<z.output<typeof refinedExistingEventSchema>>({
    resolver: zodResolver(refinedExistingEventSchema),
    defaultValues: {
      id: eventData.id ?? "",
      name: eventData.name ?? "",
      description: eventData.description ?? "",
      startDate: eventData.startDate ?? "",
      endDate: eventData.endDate ?? "",
      status: eventData.status ?? "",
    },
  });

  const isValid = form.formState.isValid;
  const formRef = useRef<HTMLFormElement>(null);

  if (!eventData) return null;

  return (
    <Form {...form}>
      <form
        className="gap-8"
        ref={formRef}
        action={(data) => {
          console.log("data", data, form.getValues());
          form.trigger();
          if (!isValid) return;
          submitEvent(data);
          handleUpdate();
        }}
      >
        <FormField
          control={form.control}
          name="id"
          render={({ field: { value, ...fieldProps } }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="hidden"
                  value={value ?? eventData.id}
                  {...fieldProps}
                />
              </FormControl>
            </FormItem>
          )}
        />
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
          {isPending ? "Loading..." : "Update Novel"}
        </Button>
      </form>
    </Form>
  );
}
