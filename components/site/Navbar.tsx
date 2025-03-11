import Link from "next/link";
import { MarkStack, WordmarkStack } from "@/components/brand/Logo";
import { getViewer } from "@/lib/server/auth";
import UserMenu from "./UserMenu";
import TerminalButton from "@/components/cli/TerminalButton";
import { Button } from "@/components/ui/button";

export default async function Navbar() {
  const viewer = await getViewer();
  return (
    <header className="no-print sticky top-0 z-40 border-b border-white/[0.06] bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[92rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-6">
          <Link href="/" data-egg="logo" className="group flex items-center gap-2 font-chakra text-lg font-bold tracking-wider">
            <MarkStack size={32} className="transition-transform group-hover:-translate-y-px" />
            <WordmarkStack className="text-lg tracking-wide" shadow={2} />
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
