"use client";

import { getApps, initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

// Only build mode reads Firestore from the browser (the `buildBlocks` collection, read-only).
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

export const clientDb = getFirestore(app);

const g = globalThis as unknown as { __firestoreEmulator?: boolean };
if (process.env.NEXT_PUBLIC_USE_EMULATORS === "true" && !g.__firestoreEmulator) {
  const [host, port] = (process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080").split(":");
  connectFirestoreEmulator(clientDb, host, Number(port));
  g.__firestoreEmulator = true;
}
