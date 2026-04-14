"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { emailVerifications, users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { appConfig } from "~/config";
// import { transporter } from "../api/update/route";

const requiredEmailSuffix = `@${appConfig.identity.requiredEmailDomain}`;
const hasRequiredEmailDomain = (email: string) =>
  email.endsWith(requiredEmailSuffix);

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .email("Valid email is required")
    .refine(hasRequiredEmailDomain),
  phoneNumber: z.string().max(20, "Phone number must be 20 characters or less"),
  major: z.string(),
});

export async function revalidateEmail(email: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userWithVerifiedEidEmail = await db.query.users.findFirst({
    where: (t, { and, eq }) =>
      and(eq(t.eidEmail, email), eq(t.eidEmailVerified, true)),
  });

  if (userWithVerifiedEidEmail) {
    return { success: false, error: appConfig.identity.duplicateEmailError };
  }

  await db
    .update(users)
    .set({
      eidEmail: email,
      eidEmailVerified: false,
    })
    .where(eq(users.id, session.user.id));

  const verificationInsert = await db
    .insert(emailVerifications)
    .values({
      userId: session.user.id,
    })
    .returning();
  const verification = verificationInsert[0]!;

  const verificationEmail = {
    from: `${appConfig.email.fromName} <${appConfig.email.recruitingFromAddress}>`,
    to: email,
    subject: appConfig.email.verificationSubject,
    text: `Please verify your email at ${appConfig.email.baseUrl}/verify/${verification.token}`,
  };
  void verificationEmail;

  // await transporter.sendMail(mailOptions);
}

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const validatedFields = updateProfileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phoneNumber: formData.get("phoneNumber"),
    major: formData.get("major"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      error:
        `Invalid form data. Email must end with ${requiredEmailSuffix}, phone number must be valid, and major must be provided.`,
    };
  }

  const { name, email, phoneNumber, major } = validatedFields.data;

  if (!hasRequiredEmailDomain(email)) {
    return {
      success: false,
      error: `Email must end with ${requiredEmailSuffix}`,
    };
  }

  const needsToRevalidateEmail = !!(email && session.user.eidEmail !== email);
  if (needsToRevalidateEmail) {
    await revalidateEmail(email);
  }

  await db
    .update(users)
    .set({
      name,
      phoneNumber,
      major,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  revalidatePath("/profile");
  return { success: true, needsToRevalidateEmail };
}
