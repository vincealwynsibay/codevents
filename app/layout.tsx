import type { Metadata } from "next";
import { Chakra_Petch, Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ClerkProvider } from "@clerk/nextjs";

import { dark } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const chakraPetchMono = Chakra_Petch({
  variable: "--font-chakra",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "codevents",
  description: "| UMTC Hackathon Events",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: dark,
        elements: {
          footer: "hidden",
        },
      }}
    >
      <html lang="en">
        <head>
          <link rel="icon" href="/images/favicon.ico" sizes="any" />
        </head>
        <body
          className={`${geistSans.variable} ${chakraPetchMono.variable} antialiased bg-[radial-gradient(circle,_rgba(255,255,255,0.08)_10%,_rgba(0,0,0,1)_80%)] `}
        >
          <Navbar />
          {children}
          <Footer />
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
