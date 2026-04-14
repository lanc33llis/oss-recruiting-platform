"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  applicationCycles,
  applicationCycleStages,
  applicationCycleStatusEnum,
  users,
} from "~/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

async function checkAdminPermissions() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user || user.role !== "ADMIN") {
    throw new Error("Admin access required");
  }

  return { user, session };
}

export async function getCycles() {
  await checkAdminPermissions();

  const cycles = await db.query.applicationCycles.findMany({
    orderBy: desc(applicationCycles.createdAt),
    with: {
      stages: {
        orderBy: (stages, { asc }) => asc(stages.startDate),
      },
    },
  });

  return cycles;
}

const createCycleSchema = z.object({
  name: z.string().min(1, "Cycle name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export async function createCycle(formData: FormData) {
  await checkAdminPermissions();

  const validatedFields = createCycleSchema.safeParse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!validatedFields.success) {
    throw new Error("Invalid form data: " + validatedFields.error.message);
  }

  const { name, startDate, endDate } = validatedFields.data;

  // Create the cycle
  const newCycle = await db
    .insert(applicationCycles)
    .values({
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      stage: "PREPARATION",
    })
    .returning();

  if (!newCycle[0]) {
    throw new Error("Failed to create cycle");
  }

  // Create default stage timeline (all stages with equal duration)
  const cycleStart = new Date(startDate);
  const cycleEnd = new Date(endDate);
  const totalDuration = cycleEnd.getTime() - cycleStart.getTime();
  const stages = applicationCycleStatusEnum.enumValues;
  const stageDuration = totalDuration / stages.length;

  const stageData = stages.map((stage, index) => ({
    cycleId: newCycle[0]!.id,
    stage,
    startDate: new Date(cycleStart.getTime() + index * stageDuration),
    endDate: new Date(cycleStart.getTime() + (index + 1) * stageDuration),
  }));

  await db.insert(applicationCycleStages).values(stageData);

  revalidatePath("/cycles");
  return { success: true, cycleId: newCycle[0].id };
}

const updateStageSchema = z.object({
  stageId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export async function updateStage(formData: FormData) {
  await checkAdminPermissions();

  const validatedFields = updateStageSchema.safeParse({
    stageId: formData.get("stageId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!validatedFields.success) {
    throw new Error("Invalid form data: " + validatedFields.error.message);
  }

  const { stageId, startDate, endDate } = validatedFields.data;

  const thisCycle = await db.query.applicationCycleStages.findFirst({
    where: eq(applicationCycleStages.id, stageId),
  });

  if (!thisCycle) {
    throw new Error("Stage not found");
  }

  const cycle = await db.query.applicationCycles.findFirst({
    where: eq(applicationCycles.id, thisCycle.cycleId),
  });

  if (!cycle) {
    throw new Error("Cycle not found");
  }

  if (new Date(endDate) > cycle.endDate) {
    await db
      .update(applicationCycles)
      .set({
        endDate: new Date(endDate),
        updatedAt: new Date(),
      })
      .where(eq(applicationCycles.id, cycle.id));
  }

  await db
    .update(applicationCycleStages)
    .set({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      updatedAt: new Date(),
    })
    .where(eq(applicationCycleStages.id, stageId));

  revalidatePath("/cycles");
  return { success: true };
}

export async function updateCycleStage(
  cycleId: string,
  newStage: "PREPARATION" | "APPLICATION" | "INTERVIEW" | "TRAIL" | "FINAL",
) {
  await checkAdminPermissions();

  await db
    .update(applicationCycles)
    .set({
      stage: newStage,
      updatedAt: new Date(),
    })
    .where(eq(applicationCycles.id, cycleId));

  revalidatePath("/cycles");
  return { success: true };
}

export async function deleteCycle(cycleId: string) {
  await checkAdminPermissions();

  // Delete stages first (cascade should handle this, but being explicit)
  await db
    .delete(applicationCycleStages)
    .where(eq(applicationCycleStages.cycleId, cycleId));

  // Delete the cycle
  await db.delete(applicationCycles).where(eq(applicationCycles.id, cycleId));

  revalidatePath("/cycles");
  return { success: true };
}
