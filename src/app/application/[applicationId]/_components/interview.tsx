import Link from "next/link";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { getApplicantCommunication } from "~/config";

const Interview = ({
  team,
  name,
  appId,
}: {
  team: string;
  name: string;
  appId: string;
}) => {
  const content = getApplicantCommunication("interview", team, name);

  return (
    <div className="space-y-4">
      <p>{content.greeting}</p>
      {content.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <Link
        className={cn(buttonVariants({ size: "sm" }), "mt-1")}
        href={`/interview?applicationId=${appId}`}
      >
        {content.actionLabel ?? "Schedule Interview"}
      </Link>
      <p className="whitespace-pre-line">{content.signoff.join("\n")}</p>
      {content.note && (
        <p className="whitespace-pre-line italic">{content.note.join("\n\n")}</p>
      )}
    </div>
  );
};

export default Interview;
