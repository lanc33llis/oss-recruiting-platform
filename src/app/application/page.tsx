import { db } from "~/server/db";
import { ApplicationList } from "./_components/ApplicationList";
import { auth } from "~/server/auth";
import { Button, buttonVariants } from "~/components/ui/button";
import { ChevronRightIcon, PlusIcon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { getTeams } from "../people/page";
import { applications } from "~/server/db/schema";
import CreateApplicationOrRedirect from "./_components/create-application-or-redirect";
import { redirect } from "next/navigation";

async function createApplication(teamId: string) {
  "use server";

  const session = await auth();
  if (!session) {
    throw new Error("User not authenticated");
  }

  if (session.user.role !== "APPLICANT") {
    throw new Error("User does not have permission to create applications");
  }

  const currentCycle = await db.query.applicationCycles.findFirst({
    orderBy: (ac, { desc }) => desc(ac.startDate),
  });

  const userApplications = await db.query.applications.findMany({
    where: (applications, { eq }) => eq(applications.userId, session.user.id),
  });

  if (
    userApplications.some(
      (app) =>
        app.teamId === teamId && app.applicationCycleId === currentCycle?.id,
    )
  ) {
    return redirect(
      `/application/${
        userApplications.find(
          (e) =>
            e.teamId === teamId && e.applicationCycleId === currentCycle?.id,
        )!.id
      }`,
    );
  }

  const newApplication = await db
    .insert(applications)
    .values({
      applicationCycleId: currentCycle!.id,
      status: "DRAFT",
      teamId,
      userId: session.user.id,
    })
    .returning();

  return newApplication[0]!.id;
}

export default async function ApplicationsPage() {
  const user = await auth();

  if (!user) {
    return <div>Please sign in to view applications</div>;
  }

  const cycles = await db.query.applicationCycles.findMany({
    orderBy: (ac, { asc }) => asc(ac.endDate),
    where: (t, { ne }) => ne(t.stage, "PREPARATION"),
  });

  const applications = await db.query.applications.findMany({
    where: (applications, { eq }) => eq(applications.userId, user.user.id),
    with: {
      team: true,
    },
  });

  const teams = await getTeams();

  return (
    <>
      <div className="pb-6">
        <h1 className="text-2xl font-medium">Applications</h1>
        <p className="text-muted-foreground">
          View and manage your applications for the Longhorn Racing team.
        </p>
        <p className="text-muted-foreground">
          {(cycles.some((cycle) => cycle.stage === "APPLICATION") &&
            "We are accepting applications.") ||
            "We're currently not accepting applications."}
        </p>
      </div>
      <div className="absolute left-0 w-full border-b" />
      <div className="flex flex-col">
        {/* {cycles.map((cycle) => {
          const openForApplications =
            cycle.stage === "APPLICATION" &&
            cycle.startDate < new Date() &&
            cycle.endDate > new Date();

          return (
            <div key={cycle.id} className="py-4">
              <div className="flex w-full items-center justify-between py-0.5">
                <div className="flex gap-2">
                  <h2 className="text-lg font-medium">{cycle.name}</h2>
                  <Badge
                    variant={
                      cycle.stage === "APPLICATION" ? "default" : "secondary"
                    }
                  >
                    {cycle.stage === "APPLICATION" ? "Open" : "Closed"}
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground">
                {cycle.startDate.toLocaleDateString()} to{" "}
                {cycle.endDate.toLocaleDateString()}
              </p>
              {openForApplications && (
                <p className="text-muted-foreground">
                  This cycle is currently open for applications. You can submit
                  a new application or edit your existing applications.
                </p>
              )}
              {user.user.role === "APPLICANT" && (
                <div className="flex flex-col gap-2 pt-4">
                  {applications
                    .filter((app) => app.applicationCycleId === cycle.id)
                    .map(
                      (app) =>
                        ({ app, team: app.team }) as {
                          app: (typeof applications)[number] | undefined;
                          team: (typeof teams)[number];
                        },
                    )
                    .concat(
                      teams
                        .filter(
                          (team) =>
                            !applications.some(
                              (app) => app.teamId === team.id,
                            ) && cycle.stage === "APPLICATION",
                        )
                        .map((team) => ({
                          team,
                          app: undefined,
                        })),
                    )
                    .sort((a, b) => {
                      if (
                        a.app?.status !== "DRAFT" &&
                        b.app?.status === "DRAFT"
                      ) {
                        return -1;
                      } else if (
                        a.app?.status === "DRAFT" &&
                        b.app?.status !== "DRAFT"
                      ) {
                        return 1;
                      }

                      return a.team.name.localeCompare(b.team.name);
                    })
                    .map(({ team, app }) => (
                      <CreateApplicationOrRedirect
                        key={team.id}
                        action={async function () {
                          "use server";
                          return await createApplication(team.id);
                        }}
                      >
                        <span className="flex items-center gap-2">
                          {team.name}
                        </span>
                        <div className="text-muted-foreground flex grow justify-end gap-2">
                          {app && (
                            <span className="text-xs">
                              {(cycle.stage !== "PREPARATION" &&
                                cycle.stage !== "APPLICATION" &&
                                "View Results") ||
                                (app.status !== "DRAFT" && "Submitted") ||
                                "Edit"}
                            </span>
                          )}
                          <ChevronRightIcon className="transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </CreateApplicationOrRedirect>
                    ))}
                </div>
              )}
              <div className="absolute left-0 w-full border-b pt-4" />
            </div>
          );
        })} */
        
        
        
        "Applications for the 2025-26 cycle are closed. All further communication will be via email. Thank you for your patience."
        
        
        }
      </div>
    </>
  );
}
