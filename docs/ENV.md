# Environment variables

Put these in `.env.local` for local runs against a real project, or in your host's settings (Firebase App Hosting
or Vercel). Local emulator runs (`pnpm dev:local`) need none of them.

| Variable | Where | Required | What it is |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | client | yes | Firebase console → Project settings → Your apps |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | client | yes | usually `<project>.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | both | yes | Firebase project id |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | client | yes | Firebase web app id |
| `FIREBASE_ADMIN_SDK` | server | not on App Hosting | Service account JSON on one line. Leave empty on App Hosting or Cloud Run, which use Application Default Credentials. |
| `OWNER_EMAILS` | server | yes | Comma-separated owner emails. Owners manage officers at `/admin/officers`. |
| `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN` | both | no | Student sign-in domain. Default `umindanao.edu.ph`. |
| `CLOUDINARY_URL` | server | no | `cloudinary://<key>:<secret>@<cloud>` enables image uploads. Without it, officers paste image links. |
| `CLOUDINARY_UPLOAD_PRESET` | server | no | Optional upload preset name. |

Secrets (`FIREBASE_ADMIN_SDK`, `CLOUDINARY_URL`) belong in your host's secret manager, never in git.
