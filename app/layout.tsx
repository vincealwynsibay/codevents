import type { Metadata } from "next";
import { Chakra_Petch, Geist } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Toaster } from "@/components/ui/toaster";
import Terminal from "@/components/cli/Terminal";
import EasterEggs from "@/components/cli/EasterEggs";
import BuildMode from "@/components/cli/BuildMode";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "codevents", template: "%s · codevents" },
  description:
    "Hackathons, talks and workshops by CODES — UM Tagum College's computing society.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${chakraPetch.variable} flex min-h-dvh flex-col antialiased`}
      >
        <Navbar />
        <main className="relative flex-1">
          <div aria-hidden className="grid-fade pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]" />
          {children}
        </main>
        <Footer />
        <Toaster />
        <Terminal />
        <EasterEggs />
        <BuildMode />
      </body>
    </html>
  );
}
