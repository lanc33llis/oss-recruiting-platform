import { Button, buttonVariants } from "~/components/ui/button";
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ChevronsUpDown, StickyNoteIcon } from "lucide-react";

import { db } from "~/server/db";
import { cn } from "~/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { CreateTeamDialog } from "./_components/create-team-dialog";
import { EditTeamDialog } from "./_components/edit-team-dialog";
import { AddSystemDialog } from "./_components/add-system-dialog";
import Link from "next/link";
import { hasPermission } from "~/server/lib/rbac";
import { auth } from "~/server/auth";
import { notFound } from "next/navigation";
import { EditSystemDialog } from "./_components/edit-system-dialog";
import { appConfig } from "~/config";

// Placeholder components for TeamList, SystemList, etc.
// These will be fleshed out later.

const TeamsPage = async () => {
  const session = await auth();

  if (!session) {
    return notFound();
  }

  if (
    !hasPermission(session, session.user.teamId, "update") &&
    !hasPermission(session, session.user.systemId, "update")
  ) {
    return notFound();
  }

  const teams = await db.query.teams.findMany({
    with: {
      systems: true,
    },
  });

  return (
    <>
      <div className="pb-6">
        <h1 className="text-2xl font-medium">{appConfig.pages.teams.title}</h1>
        <p className="text-muted-foreground">{appConfig.pages.teams.description}</p>
      </div>
      <div className="absolute left-0 w-full border-b" />
      <div className="pt-8">
        <CardHeader className="flex flex-row items-start justify-between px-0 pb-4">
          <div>
            <CardTitle>{appConfig.pages.teams.overviewTitle}</CardTitle>
            <CardDescription>{appConfig.pages.teams.overviewDescription}</CardDescription>
          </div>
          {session.user.role === "ADMIN" && <CreateTeamDialog />}
        </CardHeader>
        <div className="">
          {teams.map((team, i) => (
            <div
              key={team.id}
              className={cn(
                "border-x border-b p-4",
                i === 0 && "rounded-t border-t",
                i === teams.length - 1 && "rounded-b",
              )}
            >
              <div>
                <div className="flex justify-between">
                  <div>
                    <p>{team.name}</p>
                    <p className="text-muted-foreground">{team.description}</p>
                  </div>
                  {hasPermission(session, team.id, "update") && (
                    <EditTeamDialog team={team} />
                  )}
                </div>
                <Collapsible className="pt-4">
                  <div className="flex gap-1">
                    <CollapsibleTrigger asChild>
                      <Button variant="secondary">
                        View Systems <ChevronsUpDown width={20} />
                      </Button>
                    </CollapsibleTrigger>
                    {hasPermission(session, team.id, "update") && (
                      <AddSystemDialog teamId={team.id} />
                    )}
                    <Link
                      href="/teams/[teamId]"
                      as={`/teams/${team.id}`}
                      className={cn(
                        buttonVariants({ variant: "secondary" }),
                        "flex gap-3 text-sm",
                      )}
                    >
                      <StickyNoteIcon />
                      <span>Team Page</span>
                    </Link>
                  </div>
                  <CollapsibleContent className="pt-2">
                    {team.systems.length === 0 && (
                      <p>There are no systems for this team</p>
                    )}
                    <div>
                      {team.systems.map((system, i) => (
                        <div
                          key={system.id}
                          className={cn(
                            "flex items-center justify-between gap-2 border-x border-b p-2",
                            i === 0 && "rounded-t-md border-t",
                            i === team.systems.length - 1 && "rounded-b-md",
                          )}
                        >
                          <p>{system.name}</p>
                          <div className="flex gap-1">
                            <Link
                              href="/systems/[systemId]"
                              as={`/systems/${system.id}`}
                              className={cn(
                                buttonVariants({
                                  variant: "secondary",
                                  size: "sm",
                                }),
                                "flex gap-1 text-xs",
                              )}
                            >
                              <StickyNoteIcon />
                              <span className="ml-1">View System</span>
                            </Link>
                            {hasPermission(
                              session,
                              system.id,
                              "update",
                              "system",
                            ) && <EditSystemDialog system={system} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default TeamsPage;
