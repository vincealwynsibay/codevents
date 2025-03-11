"use client";

import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === "true";

const app =
  getApps()[0] ??
  initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-codevents"}.firebaseapp.com`,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-codevents",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });

export const clientAuth = getAuth(app);

const g = globalThis as unknown as { __authEmulator?: boolean };
if (useEmulators && !g.__authEmulator) {
  connectAuthEmulator(
    clientAuth,
    process.env.NEXT_PUBLIC_AUTH_EMULATOR_URL || "http://127.0.0.1:9099",
    { disableWarnings: true }
  );
  g.__authEmulator = true;
}
