"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionError, assertOwner } from "@/lib/server/auth";
import { runAction } from "@/lib/server/action";
import { adminsCol } from "@/lib/server/data";
import { AdminRecord, AdminRole } from "@/lib/domain";

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email.");

export async function addAdmin(email: string, role: AdminRole) {
  return runAction(async () => {
    const viewer = await assertOwner();
    const normalized = emailSchema.parse(email);
    if (role !== "OWNER" && role !== "OFFICER") throw new ActionError("Unknown role.");
    const record: AdminRecord = {
      email: normalized,
      role,
      addedBy: viewer.user.email,
      addedAt: new Date().toISOString(),
    };
    await adminsCol().doc(normalized).set(record);
    revalidatePath("/admin/officers");
    return { message: `${normalized} is now ${role === "OWNER" ? "an owner" : "an officer"}.` };
  });
}

export async function removeAdmin(email: string) {
  return runAction(async () => {
    const viewer = await assertOwner();
    const normalized = emailSchema.parse(email);
    if (normalized === viewer.user.email) {
      throw new ActionError("You can't remove yourself. Ask another owner.");
    }
    await adminsCol().doc(normalized).delete();
    revalidatePath("/admin/officers");
    return { message: `${normalized} removed.` };
  });
}
