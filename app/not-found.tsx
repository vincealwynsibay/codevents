import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4 text-center">
      <div>
        <p className="highlight font-chakra text-7xl font-bold">404</p>
        <h1 className="mt-6 font-chakra text-2xl font-bold">Nothing here</h1>
        <p className="mt-2 text-muted-foreground">This page or event doesn&apos;t exist, or it isn&apos;t public yet.</p>
        <Button asChild className="mt-6">
          <Link href="/events">Browse events</Link>
        </Button>
      </div>
    </div>
  );
}
