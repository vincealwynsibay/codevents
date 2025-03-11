"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AdminNav({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname();
  const links = [
    { href: "/admin", label: "Dashboard", active: pathname === "/admin" },
    { href: "/admin/events", label: "Events", active: pathname.startsWith("/admin/events") },
    ...(isOwner ? [{ href: "/admin/officers", label: "Officers", active: pathname.startsWith("/admin/officers") }] : []),
  ];
  return (
    <nav className="panel flex gap-1 p-1">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            "rounded-md px-3 py-1.5 font-chakra text-sm transition-colors",
            l.active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
