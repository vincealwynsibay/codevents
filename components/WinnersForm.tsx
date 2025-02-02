"use client";
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addWinners } from "@/lib/actions/event.action";
import { Event, Participant } from "@/types/types";
import { useForm } from "react-hook-form";
import { DialogClose, DialogFooter } from "./ui/dialog";

const winnersSchema = z
  .object({
    winner1: z.string().nullable(),
    winner2: z.string().nullable(),
    winner3: z.string().nullable(),
  })
  .refine((data) => {
    return (
      (data.winner1 && data.winner2 && data.winner1 === data.winner2) ||
        (data.winner1 && data.winner3 && data.winner1 === data.winner3) ||
        (data.winner2 && data.winner3 && data.winner2 === data.winner3),
      {
        message: "Winners cannot be the same",
        path: ["winner1"],
      }
    );
  });

export default function WinnersForm({
  event,
  participants,
  handleUpdate,
}: {
  event: Event;
  participants: Participant[];
  handleUpdate: () => void;
}) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof winnersSchema>>({
    resolver: zodResolver(winnersSchema),
    defaultValues: {
      winner1: event.winner1,
      winner2: event.winner2,
      winner3: event.winner3,
    },
  });

  const [selectedWinners, setSelectedWinners] = useState<string[]>(
    [event.winner1, event.winner2, event.winner3].filter(
      (value) => value != null
    )
  );

  const eventId = event.id;

  const onSubmit = async (data: z.infer<typeof winnersSchema>) => {
    setIsLoading(() => true);
    const res = await addWinners(eventId, data);
    if (!res.success) {
      setMessage(res.message);
      setIsLoading(() => false);
      return;
    }
    setIsLoading(() => false);
    setMessage("");
    handleUpdate();
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="winner1"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>1st Place</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? participants.find(
                            (participant) => participant.id === field.value
                          )?.name
                        : "Select winner"}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command
                    filter={(value, search) => {
                      if (value.includes(search)) return 1;
                      return 0;
                    }}
                  >
                    <CommandInput
                      placeholder="Search winner..."
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>No participants found.</CommandEmpty>
                      <CommandGroup>
                        {participants
                          .filter(
                            (p) =>
                              !selectedWinners.includes(p.id) ||
                              p.id === field.value
                          )
                          .map((participant) => (
                            <CommandItem
                              value={`${participant.id} ${participant.name}`}
                              key={participant.id}
                              onSelect={() => {
                                if (
                                  form.getValues().winner1 === participant.id
                                ) {
                                  form.setValue("winner1", "");
                                  setSelectedWinners((prev) =>
                                    prev.filter((id) => id !== participant.id)
                                  );
                                } else {
                                  // remove the previous winner
                                  if (form.getValues().winner1) {
                                    setSelectedWinners((prev) =>
                                      prev.filter(
                                        (id) => id !== form.getValues().winner1
                                      )
                                    );
                                  }
                                  form.setValue("winner1", participant.id);
                                  setSelectedWinners((prev) => [
                                    ...prev,
                                    participant.id,
                                  ]);
                                }
                              }}
                            >
                              {participant.name}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  participant.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="winner2"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>2nd Place</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? participants.find(
                            (participant) => participant.id === field.value
                          )?.name
                        : "Select winner"}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command
                    filter={(value, search) => {
                      if (value.includes(search)) return 1;
                      return 0;
                    }}
                  >
                    <CommandInput
                      placeholder="Search winner..."
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>No participants found.</CommandEmpty>
                      <CommandGroup>
                        {participants
                          .filter(
                            (p) =>
                              !selectedWinners.includes(p.id) ||
                              p.id === field.value
                          )
                          .map((participant) => (
                            <CommandItem
                              value={`${participant.id} ${participant.name}`}
                              key={participant.id}
                              onSelect={() => {
                                if (
                                  form.getValues().winner2 === participant.id
                                ) {
                                  form.setValue("winner2", "");
                                  setSelectedWinners((prev) =>
                                    prev.filter((id) => id !== participant.id)
                                  );
                                } else {
                                  // remove the previous winner
                                  if (form.getValues().winner2) {
                                    setSelectedWinners((prev) =>
                                      prev.filter(
                                        (id) => id !== form.getValues().winner2
                                      )
                                    );
                                  }
                                  form.setValue("winner2", participant.id);
                                  setSelectedWinners((prev) => [
                                    ...prev,
                                    participant.id,
                                  ]);
                                }
                              }}
                            >
                              {participant.name}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  participant.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="winner3"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>2nd Place</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? participants.find(
                            (participant) => participant.id === field.value
                          )?.name
                        : "Select winner"}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command
                    filter={(value, search) => {
                      if (value.includes(search)) return 1;
                      return 0;
                    }}
                  >
                    <CommandInput
                      placeholder="Search winner..."
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>No participants found.</CommandEmpty>
                      <CommandGroup>
                        {participants
                          .filter(
                            (p) =>
                              !selectedWinners.includes(p.id) ||
                              p.id === field.value
                          )
                          .map((participant) => (
                            <CommandItem
                              value={`${participant.id} ${participant.name}`}
                              key={participant.id}
                              onSelect={() => {
                                if (
                                  form.getValues().winner3 === participant.id
                                ) {
                                  form.setValue("winner3", "");
                                  setSelectedWinners((prev) =>
                                    prev.filter((id) => id !== participant.id)
                                  );
                                } else {
                                  // remove the previous winner
                                  if (form.getValues().winner3) {
                                    setSelectedWinners((prev) =>
                                      prev.filter(
                                        (id) => id !== form.getValues().winner3
                                      )
                                    );
                                  }
                                  form.setValue("winner3", participant.id);
                                  setSelectedWinners((prev) => [
                                    ...prev,
                                    participant.id,
                                  ]);
                                }
                              }}
                            >
                              {participant.name}
                              <Check
                                className={cn(
                                  "ml-auto",
                                  participant.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        {message && <FormMessage>{message}</FormMessage>}

        <DialogFooter className="justify-end mt-4 flex flex-row items-center gap-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
          <Button type="submit">{isLoading ? "Loading..." : "Complete"}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
