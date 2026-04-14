"use client";

import { ContrastIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "~/components/ui/button";
import { appConfig } from "~/config";

import { signOutAction } from "./actions";

const Footer = () => {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <>
      <div className="w-full border-b" />
      <footer className="text-muted-foreground container mx-auto flex flex-col justify-between px-2 py-2 sm:flex-row sm:items-center sm:px-0">
        <p className="pr-2 text-sm">
          © {appConfig.footer.copyrightYear} {appConfig.footer.copyrightName}
        </p>
        <div className="flex grow justify-between gap-2 sm:grow-0 sm:justify-end">
          <Button
            variant="link"
            className="text-muted-foreground pl-0 text-sm font-normal sm:pl-2 sm:font-medium"
            onClick={() => signOutAction()}
          >
            Sign Out
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="text-sm"
          >
            <ContrastIcon />
          </Button>
        </div>
      </footer>
    </>
  );
};

export default Footer;
