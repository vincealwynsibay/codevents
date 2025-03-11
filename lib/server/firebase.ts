import "server-only";
import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

const useEmulators = !!process.env.FIRESTORE_EMULATOR_HOST;

function createApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (useEmulators) {
    // Emulators need no credentials, only a project id.
    return initializeApp({ projectId: projectId || "demo-codevents" });
  }

  const raw = process.env.FIREBASE_ADMIN_SDK;
  if (raw) {
    return initializeApp({ projectId, credential: cert(JSON.parse(raw)) });
  }
  // Fall back to Application Default Credentials (Firebase App Hosting, Cloud Run).
  return initializeApp({ projectId });
}

const app = createApp();

const g = globalThis as unknown as { __codeventsDb?: Firestore };
if (!g.__codeventsDb) {
  g.__codeventsDb = getFirestore(app);
  g.__codeventsDb.settings({ ignoreUndefinedProperties: true });
}

export const db = g.__codeventsDb;
export const adminAuth = getAuth(app);
