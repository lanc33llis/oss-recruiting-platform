import { eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { applicationCycles, applications } from "~/server/db/schema";
import { Resend } from "resend";
import { env } from "~/env";
import { EmailTemplate } from "./template";
import { appConfig } from "~/config";

const resend = new Resend(env.RESEND_TOKEN);

const GET = async () => {
  // push stages when appriorate,
  // this cronjob should occur every day at 12am CST

  const now = new Date();

  // active cycles
  const cycles = await db.query.applicationCycles.findMany({
    where: (t, { gte, lte, and }) =>
      and(lte(t.startDate, now), gte(t.endDate, now)),
    with: {
      stages: true,
    },
  });

  for (const cycle of cycles) {
    for (const stage of cycle.stages) {
      if (stage.startDate <= now && stage.endDate >= now) {
        await db.batch([
          db
            .update(applicationCycles)
            .set({
              stage: stage.stage,
            })
            .where(eq(applicationCycles.id, cycle.id)),
          db
            .update(applications)
            .set({
              status: sql`
                CASE
                  WHEN EXISTS (
                    SELECT 1
                    FROM jsonb_each_text(${applications.systemStatuses}) AS kv
                    WHERE kv.value = 'NEEDS_REVIEW'
                  ) THEN 'NEEDS_REVIEW'::application_status_enum
                  ELSE 'REJECTED'::application_status_enum
                END
              `,
            })
            .where(eq(applications.applicationCycleId, cycle.id)),
        ]);

        const applicationInStage = await db.query.applications.findMany({
          where: (t, { eq }) => eq(t.applicationCycleId, cycle.id),
          with: {
            user: true,
            team: true,
          },
        });

        // 100 limit batch
        const batchSize = 100;
        for (let i = 0; i < applicationInStage.length; i += batchSize) {
          const batch = applicationInStage.slice(i, i + batchSize);
          await resend.batch.send(
            batch.map((app) => ({
              from: `${appConfig.organization.name} <${appConfig.email.transactionalFromAddress}>`,
              to: app.user.email,
              subject: `${appConfig.email.applicationUpdateSubjectPrefix} ${app.team.name}`,
              react: EmailTemplate({ name: app.user.name! }),
              idempotencyKey: `application-update-${app.id}-${stage.stage}-${new Date().toISOString().split("T")[0]}`,
            })),
          );
        }
      }
    }
  }

  return new Response("Cron job completed successfully", {
    status: 200,
  });
};

export { GET };
