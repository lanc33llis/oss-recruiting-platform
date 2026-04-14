import { ChevronRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { db } from "~/server/db";
import { appConfig } from "~/config";

const TeamPublicPage = async () => {
  const teams = await db.query.teams.findMany({
    with: {
      systems: true,
    },
  });

  return (
    <>
      <h1 className="text-2xl font-medium">{appConfig.pages.publicTeams.title}</h1>
      <p className="text-muted-foreground max-w-5xl pb-6">
        {appConfig.pages.publicTeams.description}
      </p>
      <div className="absolute left-0 w-full border-b" />
      {teams.map((team) => {
        return (
          <div key={team.id} className="pt-4">
            <div className="pb-2">
              <h2 className="text-xl font-medium">{team.name}</h2>
            </div>
            {team.image && (
              <Image
                src={team.image}
                width={1920}
                height={1080}
                alt={team.name + " pictured"}
              />
            )}
            <div className="pt-2">
              <p className="text-muted-foreground">{team.description}</p>
              <p className="text-muted-foreground">
                {appConfig.pages.publicTeams.systemsHeading}
              </p>
              <div className="flex flex-col gap-2 pt-2">
                {team.systems.map((system) => (
                  <Link
                    href={"/systems/[systemId]"}
                    as={{
                      pathname: `/systems/${system.id}`,
                    }}
                    key={system.id}
                    className={cn(
                      buttonVariants({
                        variant: "link",
                      }),
                      "h-fit max-w-full flex-col items-start gap-0 py-0 pl-0 wrap-normal",
                    )}
                  >
                    <span>{system.name}</span>
                    <span className="text-muted-foreground inline-block w-full break-words whitespace-break-spaces">
                      {(system.description?.length ?? 0) > 0
                        ? system.description
                        : appConfig.pages.publicTeams.emptySystemDescription}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="pt-12 pb-4">
              <Link
                href="/teams/[teamId]"
                as={`/teams/${team.id}`}
                className={cn(buttonVariants(), "group")}
              >
                {appConfig.pages.publicTeams.learnMoreLabel}{" "}
                <ChevronRightIcon className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="absolute left-0 w-full border-b" />
          </div>
        );
      })}
    </>
  );
};

export default TeamPublicPage;
