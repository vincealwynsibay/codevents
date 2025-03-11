"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { LogOut, Shield, Ticket, UserRound, CalendarDays } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { clientAuth } from "@/lib/client/firebase";
import Avatar from "@/components/site/Avatar";
import { useState } from "react";

export default function UserMenu({
  name,
  email,
  picture,
  isAdmin,
}: {
  name: string;
  email: string;
  picture: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/session", { method: "DELETE" });
    await signOut(clientAuth).catch(() => {});
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const item =
    "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar name={name} src={picture} size={34} />
        <span className="sr-only">Account menu</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-2">
        <div className="px-2 pb-2 pt-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
        <div className="my-1 h-px bg-border" />
        <Link href="/events" className={`${item} sm:hidden`} onClick={() => setOpen(false)}>
          <CalendarDays /> Events
        </Link>
        <Link href="/me" className={item} onClick={() => setOpen(false)}>
          <Ticket /> My events
        </Link>
        <Link href="/onboarding?edit=1" className={item} onClick={() => setOpen(false)}>
          <UserRound /> Profile
        </Link>
        {isAdmin && (
          <Link href="/admin" className={item} onClick={() => setOpen(false)}>
            <Shield /> Admin
          </Link>
        )}
        <div className="my-1 h-px bg-border" />
        <button onClick={logout} className={item}>
          <LogOut /> Sign out
        </button>
      </PopoverContent>
    </Popover>
  );
}
