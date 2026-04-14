import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { isAtLeast } from "~/server/lib/rbac";
import Search from "./_components/search";

import { updateUserRoleAndTeam } from "./actions";
import { teams as teamsTable, userRoleEnum } from "~/server/db/schema";
import { type InferSelectModel } from "drizzle-orm";
import UserRoleTeamForm from "./_components/UserRoleTeamForm";
import { systems } from "../../server/db/schema";
import { appConfig } from "~/config";

export async function getTeams() {
  "use cache";
  const teams = await db.select().from(teamsTable);

  return teams;
}

export async function getSystems() {
  "use cache";

  const allSystems = await db.select().from(systems);

  return allSystems.reduce(
    (acc, system) => {
      acc[system.teamId] = [
        ...(system.teamId in acc ? acc[system.teamId]! : []),
        system,
      ];
      return acc;
    },
    {} as Record<string, InferSelectModel<typeof systems>[]>,
  );
}

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) => {
  const { s } = await searchParams;

  const session = await auth();

  if (!session) {
    return notFound();
  }

  if (!isAtLeast(session.user.role, "SYSTEM_LEADER")) {
    return notFound();
  }

  const users = await db.query.users.findMany({
    where: (users, { eq, and, ilike }) =>
      and(
        session.user.role !== "ADMIN"
          ? eq(users.teamId, session.user.teamId)
          : undefined,
        s ? ilike(users.name, `%${s}%`) : undefined,
      ),
    orderBy: (users, { asc }) => [asc(users.createdAt)],
  });

  const teams = await getTeams();
  const idToNameMap = new Map(teams.map((team) => [team.id, team.name]));
  const roleOptions = userRoleEnum.enumValues;

  const systems = await getSystems();

  return (
    <>
      <div className="pb-6">
        <h1 className="text-2xl font-medium">{appConfig.pages.people.title}</h1>
        <p className="text-muted-foreground">{appConfig.pages.people.description}</p>
      </div>
      <div className="absolute left-0 w-full border-b" />
      <div className="mt-4">
        <Search />
      </div>
      <div className="mt-2 overflow-hidden rounded border">
        <table className="w-full">
          <thead className="bg-muted text-muted-foreground text-left">
            <tr>
              <th className="px-2 py-2 font-normal"></th>
              <th className="border-r px-2 py-2 font-normal">Name</th>
              <th className="border-r px-2 py-2 font-normal">Email</th>
              <th className="border-r px-2 py-2 font-normal">Role</th>
              <th className="border-r px-2 py-2 font-normal">Team</th>
              <th className="px-2 py-2 font-normal">System</th>
              <th className="px-2 py-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => {
              const canEdit = isAtLeast(session.user.role, "SYSTEM_LEADER");

              return (
                <tr key={user.id}>
                  <td className="text-muted-foreground px-2 py-2">
                    {index + 1}
                  </td>
                  <td className="border-r px-2 py-2">{user.name}</td>
                  <td className="border-r px-2 py-2">{user.email}</td>
                  <td className="border-r px-2 py-2">{user.role}</td>

                  <td className="border-r px-2 py-2">
                    {idToNameMap.get(user.teamId!)}
                  </td>
                  <td className="px-2 py-2">
                    {systems[user.teamId ?? ""]?.find(
                      (sys) => sys.id === user.systemId,
                    )?.name ?? "None"}
                  </td>

                  <td className="w-4 px-2 py-2">
                    {canEdit && (
                      <UserRoleTeamForm
                        user={user}
                        teams={teams}
                        systems={systems}
                        roleOptions={roleOptions}
                        session={session}
                        onSubmit={async (formData) => {
                          "use server";
                          await updateUserRoleAndTeam({
                            userId: user.id,
                            role: formData.get(
                              "role",
                            ) as (typeof userRoleEnum.enumValues)[number],
                            teamId: formData.get("teamId") as string,
                            currentUserRole: session.user.role,
                            systemId: formData.get("systemId") as
                              | string
                              | undefined,
                          });
                        }}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Page;
