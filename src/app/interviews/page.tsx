import { AvailabilityCalendar } from "./_components/AvailabilityCalendar";
import { getAvailabilities, getSystems } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { AlertCircle } from "lucide-react";

const Content = async () => {
  try {
    const [availabilities, systems] = await Promise.all([
      getAvailabilities(),
      getSystems(),
    ]);

    return (
      <AvailabilityCalendar
        initialAvailabilities={availabilities}
        systems={systems}
      />
    );
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "An unexpected error occurred.";
    return (
      <Card className="border-destructive/50 bg-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Access Restricted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">{message}</p>
          <div className="text-muted-foreground mt-4 text-sm">
            <p className="mb-2">This page is only available to:</p>
            <ul className="ml-4 list-inside list-disc space-y-1">
              <li>Team Management</li>
              <li>System Leaders</li>
              <li>Administrators</li>
            </ul>
            <p className="mt-4">
              And only during the interview stage of an active application
              cycle.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
};

export default async function InterviewsPage() {
  return (
    <main className="">
      <h1 className="text-2xl font-medium">Interview Availability</h1>
      <div className="grid gap-8">
        <div>
          <p className="text-muted-foreground mb-6">
            Select the days you&apos;re available for interviews and specify
            your time preferences.
          </p>
        </div>
      </div>
      <div className="absolute left-0 w-full border-b" />
      <div className="pt-4">
        <Content />
      </div>
    </main>
  );
}
