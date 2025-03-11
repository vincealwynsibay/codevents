// Runs `next dev` against the local Firebase emulators (start them first with `pnpm emulators`).
// No real Firebase project or credentials needed.
import { spawn } from "node:child_process";

const vars = {
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  NEXT_PUBLIC_USE_EMULATORS: "true",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-codevents",
  GCLOUD_PROJECT: "demo-codevents",
  // The first owner. Sign in with this email in the emulator's Google popup to get admin access.
  OWNER_EMAILS: "owner@umindanao.edu.ph",
};

const env = { ...process.env };
for (const [k, v] of Object.entries(vars)) env[k] = env[k] || v;

const child = spawn("pnpm", ["exec", "next", "dev", "--turbopack", ...process.argv.slice(2)], {
  stdio: "inherit",
  env,
});
child.on("exit", (code) => process.exit(code ?? 0));
