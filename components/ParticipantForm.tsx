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
import { addParticipant } from "@/lib/actions/participant.action";
import { Participant } from "@/types/types";
import { useToast } from "@/hooks/use-toast";
import { CircleCheckIcon } from "lucide-react";

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

  const form = useForm<z.output<typeof participantSchema>>({
    resolver: zodResolver(participantSchema),
    defaultValues: {
      name: "",
      email: "",
      eventId: eventId,
    },
  });

  const { toast } = useToast();
  useEffect(() => {
    if (state.success) {
      handleAddParticipant({
        id: form.getValues()["email"],
        name: form.getValues()["name"],
        email: form.getValues()["email"],
        eventId: eventId,
        yearLevel: form.getValues()["yearLevel"],
        course: form.getValues()["course"],
      });

      toast({
        description: (
          <div className="flex items-center gap-2">
            <span>
              <CircleCheckIcon className="h-5 w-5 text-green-500 inline" />
            </span>
            <span className="">Participant registered successfully.</span>
          </div>
        ),
      });

      form.reset();
    }
  }, [eventId, form, handleAddParticipant, state.success, toast]);

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
                <FormLabel>Name</FormLabel>
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
            name="course"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course</FormLabel>
                <FormControl>
                  <div className="">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      {...field}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IT">
                          BS in Information Technology
                        </SelectItem>
                        <SelectItem value="CS">
                          BS in Computer Science
                        </SelectItem>
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

          {state.message && !state.success && (
            <FormMessage>{state.message}</FormMessage>
          )}
          <Button type="submit">{isPending ? "Loading..." : "Register"}</Button>
        </form>
      </Form>
    </div>
  );
}
