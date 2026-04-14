"use client";

import Link from "next/link";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import SignInDialog from "./sign-in-dialog";

import { FileX2Icon, TriangleAlert, Menu } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useState } from "react";
import type { Session } from "next-auth";
import { appConfig } from "~/config";

function HeaderClient({
  session,
  links,
  signInAction,
}: {
  session: Session | null;
  links: Record<string, string>;
  signInAction: () => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="w-full border-b">
      <header className="container mx-auto flex px-2 py-2.5 sm:px-0">
        <nav className="flex w-full items-center justify-between">
          {/* Hamburger for mobile */}
          <div className="flex items-center sm:hidden">
            <button
              aria-label="Open menu"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2"
            >
              <Menu size={20} />
            </button>
          </div>
          {/* Links for desktop */}
          <div className="hidden gap-1 sm:flex">
            {Object.entries(links).map(([name, href]) => (
              <Link
                key={name}
                href={href}
                className={cn(buttonVariants({ variant: "link", size: "sm" }))}
              >
                {name}
              </Link>
            ))}
          </div>
          {/* Mobile menu dropdown */}
          <div
            className={cn(
              "bg-background/80 fixed top-16 left-0 z-50 flex h-screen w-full flex-col gap-1 border-b px-2 shadow-md backdrop-blur-sm transition",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 pointer-events-none opacity-0",
              menuOpen && "pointer-events-auto opacity-100",
            )}
            {...{ "data-state": menuOpen ? "open" : "closed" }}
          >
            {Object.entries(links).map(([name, href]) => (
              <Link
                key={name}
                href={href}
                className={cn(
                  buttonVariants({ variant: "link", size: "sm" }),
                  "w-fit",
                )}
                onClick={() => setMenuOpen(false)}
              >
                {name}
              </Link>
            ))}
          </div>

          {/* Profile/Sign-in and tooltips */}
          <div className="flex items-center gap-2">
            {session?.user && !session.user.resumeUrl && (
              <Tooltip>
                <TooltipTrigger>
                  <FileX2Icon className="text-amber-400" size={16} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-center text-sm">
                    {appConfig.identity.resumeWarningTitle}
                    <br /> {appConfig.identity.resumeWarningDescription}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
            {session?.user && !session.user.eidEmailVerified && (
              <Tooltip>
                <TooltipTrigger>
                  <TriangleAlert className="text-amber-400" size={16} />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-center text-sm">
                    {appConfig.identity.unverifiedEmailTitle}
                    <br /> {appConfig.identity.unverifiedEmailDescription}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
            {session?.user ? (
              <Link
                href="/profile"
                className={cn(
                  buttonVariants({ variant: "link", size: "sm" }),
                  "pl-0",
                )}
              >
                {session.user.name ?? "Profile"}
              </Link>
            ) : (
              <SignInDialog signIn={signInAction} />
            )}
          </div>
        </nav>
      </header>
    </div>
  );
}

export default HeaderClient;
