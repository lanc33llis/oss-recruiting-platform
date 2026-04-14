import { getApplicantCommunication } from "~/config";

const Rejected = ({ team, name }: { team: string; name: string }) => {
  const content = getApplicantCommunication("rejected", team, name);

  return (
    <div className="space-y-4">
      <p>{content.greeting}</p>
      {content.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <p className="whitespace-pre-line">{content.signoff.join("\n")}</p>
    </div>
  );
};

export default Rejected;
