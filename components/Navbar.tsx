"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <div className="max-w-7xl mx-auto px-10 py-4 font-chakra mb-4">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-lg font-bold">
          CODEVENTS
        </Link>
        <Link href="/events" className="">
          Events
        </Link>
      </div>
    </div>
  );
}
