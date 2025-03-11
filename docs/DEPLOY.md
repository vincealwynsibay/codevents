# Deploying codevents

These are the steps only the project owner can do, because they need your Google account, billing and DNS. Everything
in the repo is already set up for **Firebase App Hosting**: `apphosting.yaml`, the Firestore rules and the production build
(`pnpm build` passes).

Expect about 30 minutes. Do the steps in order; each one depends on the one before.

## 1. Create the Firebase project

1. Go to <https://console.firebase.google.com> and choose **Create a project**. Pick an id, for example `codevents-codes`.
   You'll paste this id in several places below.
2. Upgrade to the **Blaze** plan (Usage and billing). App Hosting requires it. A school event site this size stays inside
   the free allowance; set a budget alert of ₱100 to be safe.
3. In `.firebaserc`, replace `codevents-0000` with your project id and commit.

## 2. Turn on sign-in and the database

1. **Authentication → Sign-in method → Google → Enable.** Set the support email.
2. **Firestore Database → Create database.** Choose **production mode** and location **asia-southeast1 (Singapore)**,
   the closest region to Tagum. The location can't be changed later.
3. Deploy the locked-down rules from the repo:

   ```bash
   pnpm exec firebase login
   pnpm deploy:rules
   ```

   The rules deny all client access except reading build-mode blocks. Everything else goes through the server.

## 3. Register the web app

**Project settings → General → Your apps → Add app → Web.** Name it `codevents`; skip Firebase Hosting. Copy these four
values from the config it shows into `apphosting.yaml`:

| `apphosting.yaml` | Firebase config field |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |

These are public client values, so they're safe to commit. Also set `OWNER_EMAILS` to your own school email. Commit
and push to `main`.

## 4. Create the App Hosting backend

**Build → App Hosting → Get started.**

- Region: **asia-southeast1**
- Repository: connect GitHub and pick `vincealwynsibay/codevents`
- Live branch: `main`, root directory `/`, automatic rollouts **on**
- Backend name: `codevents`

The first rollout takes 5 to 10 minutes. When it finishes, the console shows the URL, something like
`https://codevents--<project-id>.asia-southeast1.hosted.app`.

## 5. Point the app at its own URL

1. In `apphosting.yaml`, set `NEXT_PUBLIC_SITE_URL` to that URL (or your custom domain, see step 7), with no trailing
   slash. Posters, QR codes and link previews use it.
2. **Authentication → Settings → Authorized domains → Add domain**: add the App Hosting host (without `https://`).
   Without this, Google sign-in fails with `auth/unauthorized-domain`.
3. Commit and push. App Hosting rolls out automatically.

## 6. Smoke test

Open the live URL in a private window and check:

- [ ] Home loads, with the stacked-blocks logo in the tab icon.
- [ ] Sign in with your `@umindanao.edu.ph` Google account. Your initials appear top right.
- [ ] `/admin` opens (you're the owner). Create an event, publish it with registration open.
- [ ] From a second school account, register for it. First-timers fill in their course and year once, then see the QR
      ticket on **My events**.
- [ ] On your phone, open **Admin → event → Open check-in scanner** and scan that ticket.
- [ ] Paste the event link into Messenger. The preview shows the date-block card.
- [ ] Press <kbd>`</kbd> on the home page. The terminal opens; `ls` lists events.

Then add your officers at `/admin/officers`.

## 7. Optional

- **Custom domain.** App Hosting → your backend → Settings → Domains. Add the DNS records it gives you. Then update
  `NEXT_PUBLIC_SITE_URL` and add the domain to Authorized domains (step 5).
- **Image uploads.** Without this, officers paste image links. With a Cloudinary account:

  ```bash
  pnpm exec firebase apphosting:secrets:set cloudinary-url   # paste cloudinary://<key>:<secret>@<cloud>
  ```

  Then uncomment the `CLOUDINARY_URL` block at the bottom of `apphosting.yaml` and push.

## Before you announce it

- `/prototype/*` and `/brand` are reachable by anyone who knows the URL. They're marked `noindex`, so search engines skip
  them, but delete `app/prototype` if you don't want them live.
- Build mode is shared: blocks someone places are visible to every visitor on that page. Officers and owners can wipe the
  current page with `build clear` in the terminal (press <kbd>`</kbd>).

## If something breaks

| Symptom | Fix |
| --- | --- |
| Sign-in popup closes with `auth/unauthorized-domain` | Add the host to Authorized domains (step 5). |
| Signed in but `/admin` says not allowed | Your email isn't in `OWNER_EMAILS`, or has a typo. Edit, push, wait for the rollout. |
| Rollout fails at build | App Hosting → Rollouts → the failed one → Build logs. Usually a `REPLACE_ME` left in `apphosting.yaml`. |
| Pages error with `PERMISSION_DENIED` | The backend's service account lacks Firestore access. IAM → the `firebase-app-hosting-compute` account → add **Cloud Datastore User**. |
