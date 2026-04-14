"use server";

import { db } from "~/server/db";
import { faq } from "~/server/db/schema";
import { notFound } from "next/navigation";
import { Card } from "~/components/ui/card";
import { auth } from "~/server/auth";
import Editor from "../systems/[systemId]/_components/editor";
import ReadOnly from "../teams/[teamId]/_components/read-only";
import { hasPermission, isAtLeast, UserRbac } from "~/server/lib/rbac";
import { generateHTML, generateJSON } from "@tiptap/html/server";
import StarterKit from "@tiptap/starter-kit";
import { type JSONContent } from "@tiptap/react";
import { nanoid } from "nanoid";
import FaqEditor from "./_components/faq-editor";
import { cacheLife } from "next/cache";

async function getFaq() {
  const currFaq = await db.query.faq.findFirst();
  if (!currFaq) {
    const inserted = await db.insert(faq).values({ id: nanoid() }).returning();
    return inserted[0];
  } else {
    return currFaq;
  }
}

export async function generateContent(mdx: string | null) {
  "use cache";
  cacheLife("minutes");

  if (!mdx) return "";
  const html = generateHTML(JSON.parse(mdx) as JSONContent, [StarterKit]);

  return html;
}

export default async function FaqPage() {
  const session = await auth();
  const faq = await getFaq();
  if (!faq) return notFound();

  const html = await generateContent(faq.mdx);

  console.log(html);

  return (
    <>
      <h1 className="mb-4 text-3xl font-medium">FAQ</h1>
      {session && isAtLeast(session.user.role, "ADMIN") ? (
        <FaqEditor faqId={faq.id} content={html} />
      ) : (
        <ReadOnly content={html} />
      )}
    </>
  );
}
