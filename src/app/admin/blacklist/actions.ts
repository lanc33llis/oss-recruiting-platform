"use server";

import { db } from "~/server/db";
import { blacklistedEids } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "~/server/auth";
import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";

// Fetch all blacklisted EIDs
export async function getBlacklist() {
  return db.select().from(blacklistedEids);
}

// Add an EID to the blacklist
export async function addToBlacklist(formData: FormData) {
  const eid = formData.get("eid") as string;
  const reason = formData.get("reason") as string | undefined;

  if (!eid) throw new Error("EID is required.");

  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN")
    throw new Error("Not authorized");

  await db.insert(blacklistedEids).values({
    eid,
    reason,
    createdBy: session.user.id,
  });

  revalidatePath("/admin/blacklist");
  revalidateTag("blacklist", "max");
}

// Remove an EID from the blacklist
export async function removeFromBlacklist(formData: FormData) {
  const eid = formData.get("eid") as string;
  if (!eid) throw new Error("EID is required.");

  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN")
    throw new Error("Not authorized");

  await db.delete(blacklistedEids).where(eq(blacklistedEids.eid, eid));

  revalidatePath("/admin/blacklist");
  revalidateTag("blacklist", "max");
}
