# codevents: product spec

Settled in a grilling session (rounds 1–2), plus the remaining branches decided on the recommended defaults.
Each decision lists what it changed in the code.

## Purpose

| # | Decision | Why |
| --- | --- | --- |
| Q1 | **CODES' permanent event platform**, handed down each school year to the next set of officers. Not a one-off page, not multi-org. | The data model already supported many events; multi-tenant would mean dropping the school-domain rule. |
| Q2 | **Contests, talks and workshops.** Prizes are optional (0–3 podium places). | Talks and workshops don't have winners; a variable number of places wasn't worth the complexity. |

## People and access

| # | Decision | In code |
| --- | --- | --- |
| Q3 | A student can join **many events, once each**. The old global email and name duplicate checks are gone. | Registration doc id `${eventId}_${uid}` enforces one per event. |
| Q4 | **Students sign in with Google**, limited to `@umindanao.edu.ph`, and get a "My events" page. | `/login`, `/api/session` checks the domain on the server; the `hd` hint only steers the account picker. |
| Q5 | **Firebase Auth for everyone; Clerk removed.** Unused `dataconnect/` and `functions/` folders deleted. | One auth system. Server reads an httpOnly `__session` cookie (Firebase session cookie, 14 days). |
| Q6 | **Two roles: Owner and Officer**, stored in `admins/{email}`. The first owner comes from `OWNER_EMAILS`. Owners add and remove officers in the UI. Officers may use non-school Google accounts. | `/admin/officers` (owners only). Handover = old owner adds the new president as owner. |
| Q10 | Course and year level live on the **profile**, with a **copy saved on each sign-up**. Students re-confirm once per school year (rolls over in August). | `users/{uid}.schoolYear`, `profileNeedsUpdate`, `/onboarding`. |

## Event lifecycle

| # | Decision | In code |
| --- | --- | --- |
| Q7 | **One stored `status`**: DRAFT → REGISTRATION_OPEN ⇄ REGISTRATION_CLOSED, or CANCELLED from anywhere. "Happening now", "Awaiting results" and "Completed" are **worked out from the dates**. An optional deadline and the capacity close sign-ups automatically. A contest isn't Completed until its winners are picked. | `getPhase()` in `lib/domain.ts`. Unit tested. |
| Q8 | **Home page = featured event + coming up + past events with winners.** `/events` has Upcoming and Past tabs and a type filter. | Featured = happening now, else the next event with open registration, else the next upcoming. |
| Q9 | **Teams**: each event is solo or team (min/max size). One student creates a team and gets a 6-character invite code; teammates join with it. Winners are teams. | `teams` collection; the captain passes to the next member if the captain leaves; an empty team is deleted. |
| Q11 | **Optional capacity, no waitlist. QR check-in.** Each registration has a secret token; the ticket QR is `codevents:<registrationId>:<token>`. Officers scan with a phone camera, or check people in by name. | `/admin/events/[id]/check-in`. Tested with a fake camera; scanning the same ticket twice says "already checked in". |
| Q12 | **Start fresh.** No migration of old Firestore data (the old rules had expired, so production data was unreadable anyway). | `pnpm seed` fills the emulators with demo data. |

## Remaining branches (decided on the recommended defaults)

| Branch | Decision |
| --- | --- |
| Notifications | **No email in v1.** Students get toasts, the event page and "My events"; an **Add to calendar** (.ics) download covers reminders. Email needs a provider and secrets, so it's a good v2. |
| Certificates | **Printable certificate page** (print or save as PDF, A4 landscape). Attendees who checked in get *Participation*; podium finishers get *Achievement* with their place. Unlocks when the event ends. |
| Officer tooling | Dashboard (sign-ups, attendance, "needs winners"), event manager with participants (search, filter, check-in toggle, remove), teams, winners, **CSV export** in Philippine time, duplicate event, cancel/restore, delete. |
| Security | Browsers never touch Firestore (`allow read, write: if false`). Every server action checks the session and role. Session cookies are only minted from fresh sign-ins (under 5 minutes). Draft events return 404 to students. CSV cells are guarded against formula injection. |
| Time zone | Everything is entered and shown in **Asia/Manila**, whatever the device time zone. |
| Hosting | **Firebase App Hosting** (`apphosting.yaml`), or Vercel. Node 22. |

## Ideas for later

- Email confirmations and reminders (Firebase "Trigger Email" extension or Resend).
- Waitlist that auto-promotes when someone cancels.
- Judges' scoring sheets for contests.
- Team rename and kick by the captain.
- Attendance stats per course and year level across a school year.
