import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { hasPermission, isAtLeast, isAtMaximum } from "~/server/lib/rbac";
import { getSystems, getTeams } from "../people/page";
import { columns } from "./_components/columns";
import { TableWithProvider } from "./_components/data-table";
import { db } from "~/server/db";

import { blacklistedEids, users } from "~/server/db/schema";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

async function getBlacklist() {
  "use cache";

  cacheTag("blacklist");
  cacheLife("hours");

  return await db
    .select()
    .from(blacklistedEids)
    .rightJoin(
      users,
      and(
        eq(
          users.eidEmail,
          sql.raw(`CONCAT(${blacklistedEids.eid.name}, '@eid.utexas.edu')`),
        ),
      ),
    )
    .where(isNotNull(blacklistedEids.eid));
}

const Page = async () => {
  const session = await auth();

  if (!session) {
    return notFound();
  }

  if (!hasPermission(session, session.user.teamId, "read")) {
    return notFound();
  }

  const teams = await getTeams();
  const teamIdToName = Object.fromEntries(
    teams.map((team) => [team.id, team.name]),
  );

  const systems = await getSystems();

  const blacklist = await getBlacklist();

  const currStage = await db.query.applicationCycles.findFirst({
    where: (t, { and, lte, gte }) =>
      and(lte(t.startDate, new Date()), gte(t.endDate, new Date())),
  });

  if (!currStage) {
    return (
      <div className="pb-6">
        <h1 className="text-2xl font-medium">Applications</h1>
        <p className="text-muted-foreground">
          There is no active application cycle at the moment.
        </p>
      </div>
    );
  }

  let data = await db.query.applications.findMany({
    where: (applications, { eq, and, ne, notInArray }) =>
      and(
        ne(applications.status, "DRAFT"),

        !isAtLeast(session.user.role, "ADMIN")
          ? eq(applications.teamId, session.user.teamId)
          : undefined,

        blacklist.length > 0
          ? notInArray(
              applications.userId,
              blacklist.map((b) => b.user.id),
            )
          : undefined,

        eq(applications.applicationCycleId, currStage.id),
      ),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          resumeUrl: true,
          major: true,
          phoneNumber: true,
          eidEmail: true,
        },
        with: {
          applications: {
            with: {
              team: {
                columns: {
                  name: true,
                },
              },
            },
          },
        },
      },
      team: {
        columns: {
          name: true,
        },
      },
    },
    orderBy: (applications, { asc, desc }) => [
      asc(applications.internalStatus),
      desc(applications.internalDecision),
      desc(applications.createdAt),
    ],
  });

  if (!isAtLeast(session.user.role, "ADMIN")) {
    data = data.filter((app) => app.teamId === session.user.teamId);
  }

  const currentSystemName = systems[session.user.teamId]?.find(
    (system) => system.id === session.user.systemId,
  )?.name;

  if (isAtMaximum(session.user.role, "SYSTEM_LEADER")) {
    data = data.filter((app) =>
      [
        app.data?.system1 ?? "",
        app.data?.system2 ?? "",
        app.data?.system3 ?? "",
      ].includes(currentSystemName!),
    );
  }

  data = data.map((app) => ({
    ...app,
    otherApplications: app.user.applications.filter(
      (otherApp) =>
        app.applicationCycleId === otherApp.applicationCycleId &&
        app.id !== otherApp.id,
    ),
    internalDecision:
      app.systemDecisions[session.user.systemId!] ?? "NEEDS_REVIEW",
    internalStatus: app.systemStatuses[session.user.systemId!] ?? "APPLICATION",
    highlightColor: app.highlightColor?.[session.user.systemId!],
  }));

  console.log(data);

  return (
    <>
      <div className="pb-6">
        <h1 className="text-2xl font-medium">Applications</h1>
        <p className="text-muted-foreground">
          View and manage the applications for{" "}
          {session.user.role === "ADMIN" && "Longhorn Racing."}
          {session.user.role === "TEAM_MANAGEMENT" &&
            "the " + teamIdToName[session.user.teamId] + " team."}
          {isAtMaximum(session.user.role, "SYSTEM_LEADER") &&
            systems[session.user.teamId]?.find(
              (system) => system.id === session.user.systemId,
            )?.name + " system."}
        </p>
      </div>
      <div className="absolute left-0 container mx-auto border-b" />
      <div className="h-max pt-4">
        <TableWithProvider
          columns={columns}
          data={data}
          stage={currStage.stage}
          system={session.user.systemId}
        />
      </div>
    </>
  );
};

export default Page;
