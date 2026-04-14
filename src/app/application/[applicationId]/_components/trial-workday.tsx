import Link from "next/link";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { appConfig, getTrialWorkdayConfig } from "~/config";

const TrialWorkday = ({ team }: { team: string }) => {
  const trialConfig = getTrialWorkdayConfig(team);

  if (!trialConfig) {
    return <div>{appConfig.trialWorkday.intro}</div>;
  }

  return (
    <div>
      <p>{appConfig.trialWorkday.intro}</p>
      <Link className={cn(buttonVariants({}), "mt-4")} href={trialConfig.href}>
        {trialConfig.label}
      </Link>
    </div>
  );
};

export default TrialWorkday;
