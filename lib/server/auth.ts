import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { adminAuth, db } from "./firebase";
import {
  ALLOWED_EMAIL_DOMAIN,
  AdminRole,
  UserProfile,
  profileNeedsUpdate,
} from "@/lib/domain";

// Firebase Hosting / App Hosting only forwards a cookie named __session.
export const SESSION_COOKIE = "__session";
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export type SessionUser = {
  uid: string;
  email: string;
  name: string;
  picture: string | null;
};

export type Viewer = {
  user: SessionUser;
  profile: UserProfile | null;
  role: AdminRole | null;
};

export class ActionError extends Error {}

function ownerEmails(): string[] {
  return (process.env.OWNER_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAdminRole(email: string): Promise<AdminRole | null> {
  const normalized = email.toLowerCase();
  if (ownerEmails().includes(normalized)) return "OWNER";
  const snap = await db.collection("admins").doc(normalized).get();
  if (!snap.exists) return null;
  return (snap.data()!.role as AdminRole) ?? "OFFICER";
}

/** Students must use the school domain; admins may sign in with any Google account. */
export async function isEmailAllowed(email: string) {
  if (email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) return true;
  return (await getAdminRole(email)) !== null;
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    if (!decoded.email) return null;
    return {
      uid: decoded.uid,
      email: decoded.email.toLowerCase(),
      name: (decoded.name as string) || decoded.email.split("@")[0],
      picture: (decoded.picture as string) || null,
    };
  } catch {
    return null;
  }
});

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const [profileSnap, role] = await Promise.all([
    db.collection("users").doc(user.uid).get(),
    getAdminRole(user.email),
  ]);
  return {
    user,
    profile: profileSnap.exists ? (profileSnap.data() as UserProfile) : null,
    role,
  };
});

// ---- page guards (redirect) ----

export async function requireViewer(next: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  return viewer;
}

export async function requireAdminPage(next = "/admin"): Promise<Viewer> {
  const viewer = await requireViewer(next);
  if (!viewer.role) redirect("/?error=not-admin");
  return viewer;
}

export async function requireOwnerPage(): Promise<Viewer> {
  const viewer = await requireAdminPage("/admin/officers");
  if (viewer.role !== "OWNER") redirect("/admin?error=owner-only");
  return viewer;
}

// ---- action guards (throw) ----

export async function assertViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new ActionError("Please sign in first.");
  return viewer;
}

export async function assertStudent(): Promise<
  Viewer & { profile: UserProfile }
> {
  const viewer = await assertViewer();
  // Sessions last 14 days, so re-check: school accounts, or current officers.
  if (!viewer.user.email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`) && !viewer.role) {
    throw new ActionError(`Only @${ALLOWED_EMAIL_DOMAIN} accounts can sign up for events.`);
  }
  if (!viewer.profile || profileNeedsUpdate(viewer.profile)) {
    throw new ActionError("Please complete your profile first.");
  }
  return viewer as Viewer & { profile: UserProfile };
}

export async function assertAdmin(): Promise<Viewer> {
  const viewer = await assertViewer();
  if (!viewer.role) throw new ActionError("Officers only.");
  return viewer;
}

export async function assertOwner(): Promise<Viewer> {
  const viewer = await assertAdmin();
  if (viewer.role !== "OWNER") throw new ActionError("Owner only.");
  return viewer;
}
