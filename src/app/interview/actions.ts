"use server";

import { db } from "~/server/db";
import {
  interviews,
  applications,
  availabilities,
} from "~/server/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { addMinutes, startOfDay, endOfDay, isAfter } from "date-fns";
import { auth } from "~/server/auth";
// import { transporter } from "../api/update/route";
import { appConfig } from "~/config";
import ical, {
  ICalAlarmType,
  ICalCalendarMethod,
} from "ical-generator";

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  interviewerId?: string;
  interviewerName?: string;
}

export async function getAvailableSlots(
  systemId: string | null,
  date: Date,
): Promise<TimeSlot[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Get all existing interviews for the selected date
  const existingInterviews = await db.query.interviews.findMany({
    where: and(
      gte(interviews.scheduledAt, startOfDay(date)),
      lte(interviews.scheduledAt, endOfDay(date)),
    ),
  });

  // Get availabilities for the system on the selected date
  // Availabilities define when interviewers are available
  const systemAvailabilities = await db.query.availabilities.findMany({
    where: and(
      eq(availabilities.systemId, systemId ?? ""),
      // Check if availability overlaps with the selected date
      gte(availabilities.end, startOfDay(date)),
      lte(availabilities.start, endOfDay(date)),
    ),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  const slots: TimeSlot[] = [];

  // Generate 30-minute slots from each availability window
  for (const availability of systemAvailabilities) {
    const availStart = new Date(availability.start);
    const availEnd = new Date(availability.end);

    // Only consider availability windows that overlap with the selected date
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Find the actual start and end times for this availability on the selected date
    const windowStart = availStart > dayStart ? availStart : dayStart;
    const windowEnd = availEnd < dayEnd ? availEnd : dayEnd;

    // Skip if no overlap with the selected date
    if (windowStart >= windowEnd) continue;

    // Generate 30-minute slots within this availability window
    let slotStart = new Date(windowStart);
    // Round up to the next 30-minute boundary
    const minutes = slotStart.getMinutes();
    if (minutes % 30 !== 0) {
      slotStart.setMinutes(Math.ceil(minutes / 30) * 30, 0, 0);
    }

    while (slotStart < windowEnd) {
      const slotEnd = addMinutes(slotStart, 30);

      // Skip if slot extends beyond availability window
      if (slotEnd > availEnd) break;

      // Don't show past slots
      if (isAfter(slotStart, new Date())) {
        // Check if this slot conflicts with existing interviews
        const hasConflict = existingInterviews.some((interview) => {
          const interviewStart = new Date(interview.scheduledAt);
          const interviewEnd = addMinutes(interviewStart, 30);

          return (
            (slotStart >= interviewStart && slotStart < interviewEnd) ||
            (slotEnd > interviewStart && slotEnd <= interviewEnd) ||
            (slotStart <= interviewStart && slotEnd >= interviewEnd)
          );
        });

        slots.push({
          start: slotStart,
          end: slotEnd,
          available: !hasConflict,
        });
      }

      // Move to next 30-minute slot
      slotStart = addMinutes(slotStart, 30);
    }
  }

  // Sort slots by start time and remove duplicates
  const uniqueSlots = slots
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .filter((slot, index, array) => {
      // Remove duplicate time slots (same start time)
      return (
        index === 0 ||
        slot.start.getTime() !== array[index - 1]?.start.getTime()
      );
    });

  return uniqueSlots;
}

export async function scheduleInterview(
  applicationId: string,
  systemId: string,
  startTime: Date,
  endTime: Date,
): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Verify the user owns this application
  const application = await db.query.applications.findFirst({
    where: and(
      eq(applications.id, applicationId),
      eq(applications.userId, session.user.id),
    ),
    with: {
      team: {
        columns: {
          name: true,
        },
      },
    },
  });

  if (!application) {
    throw new Error("Application not found or unauthorized");
  }

  if (application.internalStatus !== "INTERVIEW") {
    throw new Error("Application is not in interview stage");
  }

  if (application.team.name.toLowerCase() !== "solar") {
    // Check if there's already an interview scheduled for this application
    const existingInterview = await db.query.interviews.findFirst({
      where: eq(interviews.applicationId, applicationId),
    });

    if (existingInterview) {
      throw new Error("Interview already scheduled for this application");
    }
  }

  // check if there's an interview for this system
  const otherUserInterviews = await db.query.interviews.findMany({
    where: (t, { eq, and }) =>
      and(eq(t.applicationId, applicationId), eq(t.systemId, systemId)),
  });

  if (otherUserInterviews.length > 0) {
    throw new Error("An interview for this system is already scheduled");
  }

  // Double-check slot availability
  const existingInterviews = await db.query.interviews.findMany({
    where: and(
      gte(interviews.scheduledAt, startOfDay(startTime)),
      lte(interviews.scheduledAt, endOfDay(startTime)),
    ),
  });

  const hasConflict = existingInterviews.some((interview) => {
    const interviewStart = new Date(interview.scheduledAt);
    const interviewEnd = addMinutes(interviewStart, 30);

    return (
      (startTime >= interviewStart && startTime < interviewEnd) ||
      (endTime > interviewStart && endTime <= interviewEnd) ||
      (startTime <= interviewStart && endTime >= interviewEnd)
    );
  });

  if (hasConflict) {
    throw new Error("This time slot is no longer available");
  }

  // If no interviewer is specified, find an available one from the team/system
  // This ensures the interviewer is from the same system the applicant applied to

  // Create the interview
  await db.insert(interviews).values({
    applicationId,
    systemId,
    scheduledAt: startTime,
    status: "SCHEDULED",
    duration: 30,
    location: "Video Call", // Default location
    notes: "",
    createdById: session.user.id,
  });

  const calendarEvent = ical({
    name: `${appConfig.email.interviewCalendarLabel} with ${application.team.name}`,
    method: ICalCalendarMethod.REQUEST,
  });

  const event = calendarEvent.createEvent({
    start: startTime,
    end: endTime,
    summary: `${appConfig.email.interviewInviteSubjectPrefix} ${application.team.name}`,
    description: `You have an interview scheduled for the ${application.team.name} team.`,
    location: appConfig.email.interviewLocation,
    organizer: {
      name: appConfig.email.fromName,
      email: appConfig.email.recruitingFromAddress,
    },
  });

  event.createAttendee(`${session.user.name!} <${session.user.email!}>}`);
  event.createAlarm({
    type: ICalAlarmType.email,
    trigger: 30 * 60, // 30 minutes before
  });

  // await transporter.sendMail({
  //   from: `${appConfig.organization.name} <${appConfig.email.recruitingFromAddress}>`,
  //   to: session.user.email!,
  //   subject: `${appConfig.email.interviewInviteSubjectPrefix} ${application.team.name}`,
  //   text: `Dear applicant,\n\nYour interview for the ${application.team.name} team has been scheduled.\n\nDate: ${startTime.toLocaleDateString()}\nTime: ${startTime.toLocaleTimeString()}\nDuration: 30 minutes\nLocation: ${appConfig.email.interviewLocation}\n\nSincerely,\n${appConfig.email.fromName}\n${appConfig.email.baseUrl}`,
  //   icalEvent: {
  //     filename: "interview.ics",
  //     method: "request",
  //     content: calendarEvent.toString(),
  //   },
  // });
}
