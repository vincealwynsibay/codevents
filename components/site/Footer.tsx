import Link from "next/link";

export default function Footer() {
  return (
    <footer className="no-print mt-24 border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-6">
        <p className="font-chakra">
          CODEVENTS · by CODES, UM Tagum College
        </p>
        <nav className="flex gap-5">
          <Link href="/events" className="hover:text-foreground">
            Events
          </Link>
          <Link href="/events?view=past" className="hover:text-foreground">
            Past winners
          </Link>
          <Link href="/me" className="hover:text-foreground">
            My events
          </Link>
        </nav>
      </div>
    </footer>
  );
}
