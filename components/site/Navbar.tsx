import Link from "next/link";
import Image from "next/image";
import { getViewer } from "@/lib/server/auth";
import UserMenu from "./UserMenu";
import TerminalButton from "@/components/cli/TerminalButton";
import { Button } from "@/components/ui/button";

export default async function Navbar() {
  const viewer = await getViewer();
  return (
    <header className="no-print sticky top-0 z-40 border-b border-white/[0.06] bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" data-egg="logo" className="group flex items-center gap-2 font-chakra text-lg font-bold tracking-wider">
            <span className="relative grid size-8 place-items-center rounded-md border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors group-hover:border-primary/60">
              <Image src="/images/codes.png" alt="" width={20} height={20} />
            </span>
            <span>
              CODE<span className="text-blue-300">VENTS</span>
              <span className="blink ml-0.5 text-blue-300">_</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-5 font-chakra text-sm text-muted-foreground sm:flex">
            <Link href="/events" className="transition-colors hover:text-foreground">
              Events
            </Link>
            {viewer && (
              <Link href="/me" className="transition-colors hover:text-foreground">
                My events
              </Link>
            )}
            {viewer?.role && (
              <Link href="/admin" className="transition-colors hover:text-foreground">
                Admin
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
        <TerminalButton />
        {viewer ? (
          <UserMenu
            name={viewer.profile?.name || viewer.user.name}
            email={viewer.user.email}
            picture={viewer.user.picture}
            isAdmin={!!viewer.role}
          />
        ) : (
          <Button asChild size="sm" className="font-chakra tracking-wide">
            <Link href="/login">Sign in</Link>
          </Button>
        )}
        </div>
      </div>
      <div className="glow-line opacity-60" />
    </header>
  );
}
