"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { availabilities, applicationCycles, users } from "~/server/db/schema";
import { eq, ne, and, gte, lte } from "drizzle-orm";

async function checkAccessPermissions() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if user has the right role
  const allowedRoles = ["TEAM_MANAGEMENT", "SYSTEM_LEADER", "ADMIN"];
  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      "Access denied. Only team management and system leaders can manage interview availability.",
    );
  }

  const now = new Date();
  const currentCycle = await db.query.applicationCycles.findFirst({
    where: and(
      lte(applicationCycles.startDate, now),
      gte(applicationCycles.endDate, now),
    ),
  });

  if (!currentCycle) {
    throw new Error("No valid cycle");
  }

  return { user, currentCycle };
}

export async function getAvailabilities() {
  const { user } = await checkAccessPermissions();

  const userAvailabilities = await db.query.availabilities.findMany({
    where: (t, { eq, and, gte }) =>
      and(eq(t.userId, user.id), gte(t.start, new Date())),
    with: {
      system: true,
    },
  });

  return userAvailabilities;
}

export async function getOthersAvailabilities() {
  const { user } = await checkAccessPermissions();

  // Get availability from other users (not the current user)
  const othersAvailabilities = await db.query.availabilities.findMany({
    where: ne(availabilities.userId, user.id),
    with: {
      system: true,
      user: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });

  return othersAvailabilities;
}

export async function getSystems() {
  await checkAccessPermissions();
  const session = await auth();

  if (!session?.user?.teamId) {
    throw new Error("User does not belong to a team");
  }

  const allSystems = await db.query.systems.findMany({
    where: (s, { eq }) => eq(s.teamId, session.user.teamId),

    columns: {
      id: true,
      name: true,
      description: true,
    },
  });

  return allSystems;
}

export async function createAvailability(
  days: {
    date: Date;
    systemId: string;
    startTime: Date;
    endTime: Date;
  }[],
) {
  try {
    const { user } = await checkAccessPermissions();

    await db.insert(availabilities).values(
      days.map((day) => ({
        userId: user.id,
        systemId: day.systemId,
        start: new Date(
          day.date.toISOString().split("T")[0] +
            "T" +
            day.startTime.toISOString().split("T")[1],
        ),
        end: new Date(
          day.date.toISOString().split("T")[0] +
            "T" +
            day.endTime.toISOString().split("T")[1],
        ),
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );

    revalidatePath("/interviews");
  } catch (e) {
    console.error(e);
    return "Failed to create availability: " + e.message;
  }
}

export async function deleteAvailability(availabilityId: string) {
  const { user } = await checkAccessPermissions();

  // Verify the availability belongs to the current user
  const availability = await db.query.availabilities.findFirst({
    where: eq(availabilities.id, availabilityId),
  });

  if (!availability || availability.userId !== user.id) {
    return "Availability not found or unauthorized";
  }

  await db.delete(availabilities).where(eq(availabilities.id, availabilityId));

  revalidatePath("/interviews");
}

export async function updateAvailability(
  availabilityId: string,
  formData: FormData,
) {
  const { user } = await checkAccessPermissions();

  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;

  if (!startTime || !endTime) {
    throw new Error("Start and end times are required");
  }

  // Verify the availability belongs to the current user
  const availability = await db.query.availabilities.findFirst({
    where: eq(availabilities.id, availabilityId),
  });

  if (!availability || availability.userId !== user.id) {
    throw new Error("Availability not found or unauthorized");
  }

  // Update times while keeping the same date
  const existingDate = availability.start.toISOString().split("T")[0];
  const start = new Date(`${existingDate}T${startTime}`);
  const end = new Date(`${existingDate}T${endTime}`);

  await db
    .update(availabilities)
    .set({
      start,
      end,
      updatedAt: new Date(),
    })
    .where(eq(availabilities.id, availabilityId));

  revalidatePath("/interviews");
}
