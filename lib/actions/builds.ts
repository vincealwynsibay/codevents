"use server";

import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/server/firebase";
import { ActionError, assertViewer } from "@/lib/server/auth";
import { runAction } from "@/lib/server/action";

/*
  Shared build mode. One Firestore doc per block in `buildBlocks`.
  Browsers may READ this collection (firestore.rules) for live updates;
  every write goes through these actions.
*/

const BUILD_TYPES = ["blue", "glass", "amber"] as const;
const MAX_PER_USER_PER_PAGE = 20;
const MAX_PER_PAGE = 300;
const COOLDOWN_MS = 350;

const blocksCol = () => db.collection("buildBlocks");
const buildersCol = () => db.collection("buildUsers");

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

export async function placeBlock(input: { page: string; anchor: string; dx: number; type: string }) {
  return runAction<{ id: string }>(async () => {
    const viewer = await assertViewer();
    const { page, anchor, type } = input;
    const dx = Math.round(Number(input.dx));
    checkPage(page);
    checkAnchor(anchor);
    if (!BUILD_TYPES.includes(type as (typeof BUILD_TYPES)[number])) throw new ActionError("Unknown block.");
    if (!Number.isFinite(dx) || dx < -2000 || dx > 4000) throw new ActionError("Blocks can't land there.");

    const ref = blocksCol().doc();
    await db.runTransaction(async (tx) => {
      const builderRef = buildersCol().doc(viewer.user.uid);
      const [builder, mine, total, parent] = await Promise.all([
        tx.get(builderRef),
        tx.get(blocksCol().where("page", "==", page).where("uid", "==", viewer.user.uid).count()),
        tx.get(blocksCol().where("page", "==", page).count()),
        anchor.startsWith("block:") ? tx.get(blocksCol().doc(anchor.slice(6))) : Promise.resolve(null),
      ]);
      const last = (builder.data()?.lastAt as number | undefined) ?? 0;
      if (Date.now() - last < COOLDOWN_MS) throw new ActionError("Easy there, one block at a time.");
      if (mine.data().count >= MAX_PER_USER_PER_PAGE) {
        throw new ActionError(`You've placed ${MAX_PER_USER_PER_PAGE} blocks here. Break one to place another.`);
      }
      if (total.data().count >= MAX_PER_PAGE) throw new ActionError("This page is full. Try another one.");
      if (parent && (!parent.exists || parent.data()?.page !== page)) throw new ActionError("That block is gone.");

      tx.set(ref, {
        page,
        anchor,
        dx,
        type,
        uid: viewer.user.uid,
        name: (viewer.profile?.name || viewer.user.name).split(" ").slice(0, 2).join(" "),
        createdAt: Date.now(),
      });
      tx.set(builderRef, { lastAt: Date.now(), placed: FieldValue.increment(1) }, { merge: true });
    });
    return { data: { id: ref.id } };
  });
}

export async function breakBlock(id: string) {
  return runAction(async () => {
    const viewer = await assertViewer();
    if (!/^[A-Za-z0-9]{6,40}$/.test(id)) throw new ActionError("Block not found.");
    await db.runTransaction(async (tx) => {
      const ref = blocksCol().doc(id);
      const snap = await tx.get(ref);
      if (!snap.exists) return; // already gone: fine
      const b = snap.data()!;
      if (b.uid !== viewer.user.uid && !viewer.role) throw new ActionError("You can only break your own blocks.");
      // whatever rested on it falls onto whatever was under it
      const children = await tx.get(blocksCol().where("anchor", "==", `block:${id}`));
      children.docs.forEach((c) => tx.update(c.ref, { anchor: b.anchor, dx: b.dx }));
      tx.delete(ref);
    });
  });
}

export async function clearBuildPage(page: string) {
  return runAction(async () => {
    const viewer = await assertViewer();
    if (!viewer.role) throw new ActionError("Officers only.");
    checkPage(page);
    const snap = await blocksCol().where("page", "==", page).get();
    const writer = db.bulkWriter();
    snap.docs.forEach((d) => writer.delete(d.ref));
    await writer.close();
    return { message: `Cleared ${snap.size} blocks.` };
  });
}
