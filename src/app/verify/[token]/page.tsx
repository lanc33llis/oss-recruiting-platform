import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { emailVerifications, users } from "~/server/db/schema";
import { appConfig } from "~/config";

const VerifyPage = async ({
  params,
}: {
  params: Promise<{ token: string }>;
}) => {
  const { token } = await params;

  const verificationEmail = await db.query.emailVerifications.findFirst({
    where: (t, { eq }) => eq(t.token, token),
  });

  if (!token) {
    return (
      <div className="pb-6">
        <h1 className="text-2xl font-medium">
          {appConfig.identity.verificationPageTitle}
        </h1>
        <p className="text-muted-foreground">
          {appConfig.identity.verificationMissingTokenMessage}
        </p>
      </div>
    );
  }

  if (!verificationEmail) {
    return (
      <div className="pb-6">
        <h1 className="text-2xl font-medium">
          {appConfig.identity.verificationPageTitle}
        </h1>
        <p className="text-muted-foreground">
          {appConfig.identity.verificationAlreadyUsedMessage}
        </p>
      </div>
    );
  }

  if (verificationEmail.expires <= new Date()) {
    return (
      <div className="pb-6">
        <h1 className="text-2xl font-medium">
          {appConfig.identity.verificationPageTitle}
        </h1>
        <p className="text-muted-foreground">
          {appConfig.identity.verificationExpiredMessage}
        </p>
      </div>
    );
  }

  await db
    .update(users)
    .set({
      eidEmailVerified: true,
    })
    .where(eq(users.id, verificationEmail.userId));

  await db
    .delete(emailVerifications)
    .where(eq(emailVerifications.token, token));

  return (
    <>
      <div className="pb-6">
        <h1 className="text-2xl font-medium">
          {appConfig.identity.verificationPageTitle}
        </h1>
        <p className="text-muted-foreground">
          {appConfig.identity.verificationSuccessMessage}
        </p>
      </div>
    </>
  );
};

export default VerifyPage;
