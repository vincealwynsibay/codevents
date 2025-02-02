"use client";

import { createEvent } from "@/lib/actions/event.action";
import { refinedEventSchema } from "@/lib/validation";
import { useActionState, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import FileInput from "./FileInput";

export default function EventForm({ serverDate }: { serverDate: Date }) {
  const [state, submitEvent, isPending] = useActionState(createEvent, {
    message: "",
  });
  const [open, setOpen] = useState(false);

  const router = useRouter();

  const form = useForm<z.output<typeof refinedEventSchema>>({
    resolver: zodResolver(refinedEventSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: serverDate.toISOString(),
      endDate: serverDate.toISOString(),
      status: "",
      prize1: "",
      prize2: "",
      prize3: "",
      ...(state?.fields ?? {}),
    },
  });

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      form.reset();
    }
  }, [form, state]);

  const isValid = form.formState.isValid;
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="default">
          <Plus /> Create new Event
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95%] lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create new Event</DialogTitle>
        </DialogHeader>
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
                            className="mx-0 aspect-square"
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
                            className="h-full"
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
                            className="mx-0 aspect-square"
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
                            className="h-full"
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
                            className="mx-0 aspect-square"
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
                            className="h-full"
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
            {state.message && <FormMessage>{state.message}</FormMessage>}
            <DialogFooter className="justify-end mt-4 flex flex-row items-center gap-4">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
              <Button type="submit">
                {isPending ? "Loading..." : "Create Event"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
