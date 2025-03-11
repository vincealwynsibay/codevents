import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/server/firebase";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
  isEmailAllowed,
} from "@/lib/server/auth";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/domain";

export async function POST(req: NextRequest) {
  const { idToken } = (await req.json().catch(() => ({}))) as {
    idToken?: string;
  };
  if (!idToken) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  let email: string | undefined;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    // Roles are keyed by email, so only trust verified Google sign-ins.
    if (decoded.firebase?.sign_in_provider !== "google.com" || decoded.email_verified !== true) {
      return NextResponse.json({ error: "Please sign in with Google." }, { status: 403 });
    }
    email = decoded.email;
    // Only accept recent sign-ins when minting a long-lived session.
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
      return NextResponse.json(
        { error: "Sign-in expired, please try again." },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid sign-in." }, { status: 401 });
  }

  if (!email || !(await isEmailAllowed(email))) {
    return NextResponse.json(
      {
        error: `Use your @${ALLOWED_EMAIL_DOMAIN} Google account to sign in.`,
      },
      { status: 403 }
    );
  }

  const cookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
