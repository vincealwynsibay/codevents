import Link from "next/link";
import Image from "next/image";
import { getViewer } from "@/lib/server/auth";
import UserMenu from "./UserMenu";
import { Button } from "@/components/ui/button";

export default async function Navbar() {
  const viewer = await getViewer();
  return (
    <header className="no-print sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-chakra text-lg font-bold tracking-wider">
            <Image src="/images/codes.png" alt="" width={24} height={24} />
            CODEVENTS
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
    </header>
  );
}
