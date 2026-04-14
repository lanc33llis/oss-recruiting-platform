import { appConfig } from "~/config";

export default function HomePage() {
  return (
    <div className="flex min-h-[60vh] flex-col">
      <div className="">
        <h1 className="text-2xl font-medium">{appConfig.pages.home.title}</h1>
        <p className="text-muted-foreground">
          {appConfig.pages.home.description}
        </p>
      </div>
    </div>
  );
}
