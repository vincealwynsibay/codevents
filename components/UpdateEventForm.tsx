"use client";

import { refinedExistingEventSchema } from "@/lib/validation";
import { useActionState, useRef } from "react";
import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
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
import FileInput from "./FileInput";
import { DialogClose, DialogFooter } from "./ui/dialog";

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
      prize1: eventData.prize1 ?? "",
      prize2: eventData.prize2 ?? "",
      prize3: eventData.prize3 ?? "",
      prizeDescription1: eventData.prizeDescription1 ?? "",
      prizeDescription2: eventData.prizeDescription2 ?? "",
      prizeDescription3: eventData.prizeDescription3 ?? "",
    },
  });

  const isValid = form.formState.isValid;
  const formRef = useRef<HTMLFormElement>(null);

  if (!eventData) return null;

  return (
    <Form {...form}>
      <form
        className="gap-8 overflow-y-auto"
        ref={formRef}
        action={(data) => {
          form.trigger();
          if (!isValid) return;
          submitEvent(data);
          handleUpdate();
        }}
      >
        <div className="flex flex-col gap-2 overflow-y-scroll md:grid md:grid-cols-2 md:gap-8">
          <div className="flex flex-col gap-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input placeholder="hackathon2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="hackathon2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <div className="">
                      <DateTimePicker
                        value={parseISO(value)}
                        onChange={(date) =>
                          date && onChange(date?.toISOString())
                        }
                        {...fieldProps}
                      />
                      <Input type="hidden" value={value} {...fieldProps} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <div className="">
                      <DateTimePicker
                        value={parseISO(value)}
                        onChange={(date) =>
                          date && onChange(date?.toISOString())
                        }
                        {...fieldProps}
                      />
                      <Input type="hidden" value={value} {...fieldProps} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex flex-col gap-2 w-full">
            <FormLabel>Prize 1</FormLabel>
            <div className="grid grid-cols-[100px_1fr] lg:pr-4 gap-4 w-full">
              <FormField
                control={form.control}
                name="prize1"
                render={({
                  field: { value, onChange, ref, ...fieldProps },
                }) => (
                  <FormItem>
                    <FormControl>
                      <FileInput
                        className=" mx-0 aspect-square"
                        value={value}
                        onChange={onChange}
                        ref={ref}
                        fieldProps={fieldProps}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prizeDescription1"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        className="h-full w-full"
                        {...field}
                        placeholder="Enter Prize 1 Description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormLabel>Prize 2</FormLabel>
            <div className="grid grid-cols-[100px_1fr] lg:pr-4 gap-4 w-full">
              <FormField
                control={form.control}
                name="prize2"
                render={({
                  field: { value, onChange, ref, ...fieldProps },
                }) => (
                  <FormItem>
                    <FormControl>
                      <FileInput
                        className=" mx-0 aspect-square"
                        value={value}
                        onChange={onChange}
                        ref={ref}
                        fieldProps={fieldProps}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prizeDescription2"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        className="h-full w-full"
                        {...field}
                        placeholder="Enter Prize 2 Description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormLabel>Prize 3</FormLabel>
            <div className="grid grid-cols-[100px_1fr] lg:pr-4 gap-4 w-full">
              <FormField
                control={form.control}
                name="prize3"
                render={({
                  field: { value, onChange, ref, ...fieldProps },
                }) => (
                  <FormItem>
                    <FormControl>
                      <FileInput
                        className=" mx-0 aspect-square"
                        value={value}
                        onChange={onChange}
                        ref={ref}
                        fieldProps={fieldProps}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prizeDescription3"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        className="h-full w-full flex-1 grow"
                        {...field}
                        placeholder="Enter Prize 3 Description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="hidden" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {state.message && <FormMessage>{state.message}</FormMessage>}
        <DialogFooter className="sm:justify-end mt-4  flex flex-row items-center gap-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
          <Button type="submit">{isPending ? "Loading..." : "Event"}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
