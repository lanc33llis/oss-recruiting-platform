"use server";

import { auth, signIn } from "~/server/auth";
import type { Session } from "next-auth";
import { isAtLeast } from "~/server/lib/rbac";
import { appConfig } from "~/config";

import HeaderClient from "./header-client";

const defaultLinks = Object.fromEntries(
  appConfig.navigation.public.map(({ label, href }) => [label, href]),
);
const applicantLinks = Object.fromEntries(
  appConfig.navigation.applicant.map(({ label, href }) => [label, href]),
);
const memberLinks = Object.fromEntries(
  appConfig.navigation.member.map(({ label, href }) => [label, href]),
);
const managementLinks = Object.fromEntries(
  appConfig.navigation.management.map(({ label, href }) => [label, href]),
);
const adminLinks = Object.fromEntries(
  appConfig.navigation.admin.map(({ label, href }) => [label, href]),
);

async function signInAction() {
  "use server";
  await signIn("google");
}

const getLinksForSession = (session: Session | null) => {
  let links = { ...defaultLinks };
  if (isAtLeast(session?.user?.role, "APPLICANT")) {
    links = { ...links, ...applicantLinks };
  }
  if (isAtLeast(session?.user?.role, "MEMBER")) {
    links = { ...links, ...memberLinks };
  }
  if (isAtLeast(session?.user?.role, "SYSTEM_LEADER")) {
    links = { ...links, ...managementLinks };
  }
  if (isAtLeast(session?.user?.role, "ADMIN")) {
    links = { ...links, ...adminLinks };
  }
  return links;
};

const Header = async () => {
  const session: Session | null = await auth();
  const links = getLinksForSession(session);
  return (
    <HeaderClient session={session} signInAction={signInAction} links={links} />
  );
};

export default Header;
