# codevents

The event platform for **CODES** (UM Tagum College's computing society): hackathons, talks and workshops,
from publishing to sign-ups, QR check-in, winners and certificates.

- **Students** sign in with their `@umindanao.edu.ph` Google account, sign up solo or as a team, get a QR ticket,
  and download a certificate after attending.
- **Officers** create events, open and close registration, scan tickets at the door, pick winners, and export
  attendee lists.
- **Owners** (adviser or president) add and remove officers, so access passes from one year's officers to the next
  without touching code.

The decisions behind the design are in [`docs/SPEC.md`](docs/SPEC.md).

## Stack

Next.js 15 (App Router, server actions) · Firebase Auth (Google) · Firestore through the Admin SDK only ·
Tailwind + Radix · Cloudinary for optional image uploads.

Browsers never talk to Firestore directly. `firestore.rules` denies everything, and all reads and writes go through
the server, which checks the session cookie first.

## Run it locally (no Firebase project needed)

Requires **Node 22** (see `.nvmrc`; Node 25 breaks `firebase-admin`'s JWT dependency) and **Java 11+** for the
Firestore emulator.

```bash
nvm use
pnpm install
pnpm emulators          # terminal 1: Auth + Firestore emulators (UI on http://localhost:4500)
pnpm seed               # terminal 2: demo events, students, teams, winners
pnpm dev:local          # http://localhost:3000, wired to the emulators
```

Sign in with the emulator's fake Google popup ("Add new account"):

| Email | Role |
| --- | --- |
| `owner@umindanao.edu.ph` | Owner (set through `OWNER_EMAILS` in `scripts/dev-local.mjs`) |
| `officer@umindanao.edu.ph` | Officer (seeded) |
| any other `@umindanao.edu.ph` | Student |
| anything else | Rejected |

```bash
pnpm test        # domain rules (phases, school year, QR payloads)
pnpm typecheck
pnpm lint
```

## Deploy

Full step-by-step handoff, with a smoke test and troubleshooting: [`docs/DEPLOY.md`](docs/DEPLOY.md). In short:

1. Create a Firebase project. Enable **Authentication → Google** and **Firestore**.
2. Deploy the locked-down rules: `pnpm deploy:rules`.
3. Host the Next.js app on **Firebase App Hosting** (recommended: `apphosting.yaml` is included) or Vercel.
   Set the variables listed in [`docs/ENV.md`](docs/ENV.md). On App Hosting, leave `FIREBASE_ADMIN_SDK` empty, because it uses the
   service account automatically.
4. Add your production domain under **Authentication → Settings → Authorized domains**.
5. Put the first owner's email in `OWNER_EMAILS`. They then add officers from `/admin/officers`.

## How it fits together

```
app/
  page.tsx                    home: featured event, coming up, past winners
  events/                     list (upcoming / past, filter by type) and event page
  events/[id]/calendar.ics    add-to-calendar download
  login, onboarding, me       sign-in, yearly profile, my tickets & history
  certificates/[id]           printable certificate (attended → participation; podium → achievement)
  admin/                      dashboard, events, event manager, check-in scanner, CSV export, officers
  api/session                 exchanges a Google ID token for an httpOnly session cookie
lib/
  domain.ts                   types and pure rules (event phases, school year, QR format)
  schemas.ts                  zod input validation
  server/                     firebase-admin, auth guards, data access, action helper
  actions/                    server actions (events, registrations/check-in, officers, uploads)
components/                   UI (events, admin, auth, site, form, ui primitives)
scripts/                      emulator dev runner and seed data
```

### Data model (Firestore)

| Collection | Key | Notes |
| --- | --- | --- |
| `events` | auto | `status` (DRAFT / REGISTRATION_OPEN / REGISTRATION_CLOSED / CANCELLED), dates, capacity, solo/team, prizes, winners, `registrationCount` |
| `registrations` | `${eventId}_${uid}` | one per student per event (the key enforces it); snapshot of name/course/year; `checkinToken`, `checkedInAt`, `teamId` |
| `teams` | auto | per event; 6-character invite `code`; captain and members |
| `users` | uid | profile: name, course, year level, `schoolYear` last confirmed |
| `admins` | email | `OWNER` or `OFFICER` |

"Happening now" and "Completed" aren't stored. They're worked out from the dates (`getPhase` in `lib/domain.ts`), so
nobody has to remember to flip a switch when an event starts.
