import { db } from "~/server/db";
import { eq } from "drizzle-orm";
import { systems } from "~/server/db/schema";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import Image from "next/image";
import { auth } from "~/server/auth";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { generateHTML, generateJSON } from "@tiptap/html/server";
import StarterKit from "@tiptap/starter-kit";
import { type JSONContent } from "@tiptap/react";
import Editor from "./_components/editor";
import { hasPermission, UserRbac } from "~/server/lib/rbac";
import ReadOnly from "~/app/teams/[teamId]/_components/read-only";
import { cacheLife } from "next/cache";

async function getSystem(systemId: string) {
  return await db.query.systems.findFirst({
    where: eq(systems.id, systemId),
    with: {
      team: {
        with: {
          users: true,
        },
      },
    },
  });
}

export async function generateContent(mdx: string | null) {
  "use cache";
  cacheLife("days");

  if (!mdx) return "";
  const html = generateHTML(JSON.parse(mdx) as JSONContent, [StarterKit]);

  return html;
}

export default async function SystemPage({
  params,
}: {
  params: Promise<{ systemId: string }>;
}) {
  const session = await auth();

  const rbac = session ? new UserRbac(session.user) : undefined;
  const { systemId } = await params;
  const system = await getSystem(systemId);

  if (!system) {
    return notFound();
  }

  const html = await generateContent(system.mdx);

  return (
    <>
      <div className="pb-6">
        <h1 className="text-2xl font-medium">{system.name}</h1>
        <p className="text-muted-foreground">{system.description}</p>
      </div>
      <div className="absolute left-0 w-full border-b" />
      <div className="pt-4">
        {(session &&
          rbac?.permissionForStaticResource(systemId, "update", "system") && (
            <Editor systemId={systemId} content={html} />
          )) || <ReadOnly content={html} />}
      </div>
    </>
  );
}
