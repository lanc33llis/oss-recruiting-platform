import * as React from "react";
import { appConfig } from "~/config";

interface EmailTemplateProps {
  name: string;
}

export function EmailTemplate({ name }: EmailTemplateProps) {
  return (
    <div>
      <p>{name}</p>
      <br />
      <p>
        There has been an update to your application for {appConfig.organization.name}. Please
        log in to your account to view the latest status of your application.{" "}
        {appConfig.organization.name} {appConfig.email.baseUrl}
      </p>
    </div>
  );
}
