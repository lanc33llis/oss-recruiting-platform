import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import Header from "./_components/header";
import Footer from "./_components/footer";
import { ThemeProvider } from "next-themes";
import { Toaster } from "~/components/ui/sonner";
import { appConfig } from "~/config";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { TooltipProvider } from "~/components/ui/tooltip";

export const metadata: Metadata = {
  title: appConfig.metadata.title,
  description: appConfig.metadata.description,
  icons: [{ rel: "icon", url: appConfig.metadata.iconPath }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <TRPCReactProvider>
          <ThemeProvider
            disableTransitionOnChange
            enableSystem
            attribute="class"
            defaultTheme="system"
          >
            <TooltipProvider>
              <main className="flex min-h-screen flex-col">
                <Header />
                <section className="relative container mx-auto grow border-x px-4 py-6">
                  {children}
                </section>
                <Footer />
              </main>
            </TooltipProvider>
          </ThemeProvider>
        </TRPCReactProvider>
        <Toaster />
      </body>
      <SpeedInsights />
      <Analytics />
    </html>
  );
}
