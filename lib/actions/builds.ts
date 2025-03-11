"use server";

import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/server/firebase";
import { ActionError, assertOwner, getViewer } from "@/lib/server/auth";
import { runAction } from "@/lib/server/action";

/*
  Shared build mode. One Firestore doc per block in `buildBlocks`.
  Browsers may READ this collection (firestore.rules) for live updates;
  every write goes through these actions.

  Anyone can build:
  - signed-in students: 20 blocks per page, blocks stay
  - guests: a random httpOnly `cv_guest` cookie id, 8 blocks per page,
    blocks expire after 24 h, and a per-device throttle keyed on a hash of
    the IP (never the raw IP) so clearing cookies doesn't buy more blocks
*/

const BUILD_TYPES = ["blue", "glass", "amber"] as const;
const MAX_PER_USER_PER_PAGE = 20;
const MAX_PER_GUEST_PER_PAGE = 8;
const MAX_PER_DEVICE_PER_PAGE = 24; // guests sharing one network/device, across cookie resets
const MAX_GUEST_PER_PAGE = 150;
const MAX_PER_PAGE = 300;
const COOLDOWN_MS = 350;
const GUEST_TTL_MS = 24 * 60 * 60 * 1000;
const GUEST_COOKIE = "cv_guest";

const blocksCol = () => db.collection("buildBlocks");
const buildersCol = () => db.collection("buildUsers");

type Builder = { uid: string; name: string; guest: boolean; officer: boolean; device: string };

async function deviceHash() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || h.get("x-real-ip") || "local").split(",")[0].trim();
  const ua = h.get("user-agent") || "";
  return createHash("sha256").update(`${ip}|${ua}|codevents-build`).digest("hex").slice(0, 24);
}

/** The person building: a signed-in student, or a guest identified by a random cookie. */
async function getBuilder(createGuest: boolean): Promise<Builder | null> {
  const device = await deviceHash();
  const viewer = await getViewer();
  if (viewer) {
    return {
      uid: viewer.user.uid,
      name: (viewer.profile?.name || viewer.user.name).split(" ").slice(0, 2).join(" "),
      guest: false,
      officer: !!viewer.role,
      device,
    };
  }
  const jar = await cookies();
  let id = jar.get(GUEST_COOKIE)?.value;
  if (!id || !/^g_[a-f0-9]{32}$/.test(id)) {
    if (!createGuest) return null;
    id = `g_${randomBytes(16).toString("hex")}`;
    jar.set(GUEST_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return { uid: id, name: "guest", guest: true, officer: false, device };
}

function checkPage(page: string) {
  if (typeof page !== "string" || !page.startsWith("/") || page.length > 200 || page.includes("..")) {
    throw new ActionError("Can't build on this page.");
  }
}

/** Anchors: "floor", "block:<id>", or a data-anchor id like "hero" or "event-abc123". */
function checkAnchor(anchor: string) {
  if (anchor === "floor") return;
  if (/^block:[A-Za-z0-9]{6,40}$/.test(anchor)) return;
  if (/^[a-z0-9][a-z0-9-]{0,80}$/.test(anchor)) return;
  throw new ActionError("Blocks can't land there.");
}

/** Remove expired guest blocks on a page (cheap: equality-only query, filtered here). */
async function sweepExpired(page: string) {
  const snap = await blocksCol().where("page", "==", page).where("guest", "==", true).get();
  const now = Date.now();
  const expired = snap.docs.filter((d) => (d.data().expiresAt ?? Infinity) < now);
  if (expired.length === 0) return;
  const writer = db.bulkWriter();
  for (const d of expired) {
    // anything resting on an expired block drops to where it stood
    const kids = await blocksCol().where("anchor", "==", `block:${d.id}`).get();
    kids.docs.forEach((k) => writer.update(k.ref, { anchor: d.data().anchor, dx: d.data().dx }));
    writer.delete(d.ref);
  }
  await writer.close();
}

export async function placeBlock(input: { page: string; anchor: string; dx: number; type: string }) {
  return runAction<{ id: string }>(async () => {
    const { page, anchor, type } = input;
    const dx = Math.round(Number(input.dx));
    checkPage(page);
    checkAnchor(anchor);
    if (!BUILD_TYPES.includes(type as (typeof BUILD_TYPES)[number])) throw new ActionError("Unknown block.");
    if (!Number.isFinite(dx) || dx < -2000 || dx > 4000) throw new ActionError("Blocks can't land there.");
    const me = (await getBuilder(true))!;

    await sweepExpired(page);

    const ref = blocksCol().doc();
    await db.runTransaction(async (tx) => {
      const builderRef = buildersCol().doc(me.uid);
      const deviceRef = buildersCol().doc(`device_${me.device}`);
      const [builder, device, mine, total, guests, fromDevice, parent] = await Promise.all([
        tx.get(builderRef),
        tx.get(deviceRef),
        tx.get(blocksCol().where("page", "==", page).where("uid", "==", me.uid).count()),
        tx.get(blocksCol().where("page", "==", page).count()),
        me.guest ? tx.get(blocksCol().where("page", "==", page).where("guest", "==", true).count()) : Promise.resolve(null),
        me.guest ? tx.get(blocksCol().where("page", "==", page).where("device", "==", me.device).count()) : Promise.resolve(null),
        anchor.startsWith("block:") ? tx.get(blocksCol().doc(anchor.slice(6))) : Promise.resolve(null),
      ]);
      const now = Date.now();
      const last = Math.max((builder.data()?.lastAt as number | undefined) ?? 0, (device.data()?.lastAt as number | undefined) ?? 0);
      if (now - last < COOLDOWN_MS) throw new ActionError("Easy there, one block at a time.");

      const cap = me.guest ? MAX_PER_GUEST_PER_PAGE : MAX_PER_USER_PER_PAGE;
      if (mine.data().count >= cap) {
        throw new ActionError(
          me.guest
            ? `Guests can place ${cap} blocks per page. Sign in (press \` then login) for ${MAX_PER_USER_PER_PAGE}, and they won't expire.`
            : `You've placed ${cap} blocks here. Break one to place another.`
        );
      }
      if (fromDevice && fromDevice.data().count >= MAX_PER_DEVICE_PER_PAGE) {
        throw new ActionError("That's a lot of blocks from this device. Sign in to keep building.");
      }
      if (guests && guests.data().count >= MAX_GUEST_PER_PAGE) {
        throw new ActionError("Guest space on this page is full. Sign in to build here.");
      }
      if (total.data().count >= MAX_PER_PAGE) throw new ActionError("This page is full. Try another one.");
      if (parent && (!parent.exists || parent.data()?.page !== page)) throw new ActionError("That block is gone.");

      tx.set(ref, {
        page,
        anchor,
        dx,
        type,
        uid: me.uid,
        name: me.name,
        guest: me.guest,
        device: me.device,
        createdAt: now,
        ...(me.guest ? { expiresAt: now + GUEST_TTL_MS } : {}),
      });
      tx.set(builderRef, { lastAt: now, placed: FieldValue.increment(1) }, { merge: true });
      tx.set(deviceRef, { lastAt: now }, { merge: true });
    });
    return { data: { id: ref.id } };
  });
}

export async function breakBlock(id: string) {
  return runAction(async () => {
    if (!/^[A-Za-z0-9]{6,40}$/.test(id)) throw new ActionError("Block not found.");
    const me = await getBuilder(false);
    if (!me) throw new ActionError("You can only break your own blocks.");
    await db.runTransaction(async (tx) => {
      const ref = blocksCol().doc(id);
      const snap = await tx.get(ref);
      if (!snap.exists) return; // already gone: fine
      const b = snap.data()!;
      if (b.uid !== me.uid && !me.officer) throw new ActionError("You can only break your own blocks.");
      // whatever rested on it falls onto whatever was under it
      const children = await tx.get(blocksCol().where("anchor", "==", `block:${id}`));
      children.docs.forEach((c) => tx.update(c.ref, { anchor: b.anchor, dx: b.dx }));
      tx.delete(ref);
    });
  });
}

export async function clearBuildPage(page: string) {
  return runAction(async () => {
    const me = await getBuilder(false);
    if (!me?.officer) {
      // assertOwner throws the right message for signed-out users too
      await assertOwner();
    }
    checkPage(page);
    const snap = await blocksCol().where("page", "==", page).get();
    const writer = db.bulkWriter();
    snap.docs.forEach((d) => writer.delete(d.ref));
    await writer.close();
    return { message: `Cleared ${snap.size} blocks.` };
  });
}
