const organization = {
  name: "Longhorn Racing",
  shortName: "LHR",
  parentName: "UT Austin",
  description: "Recruiting platform for teams, applicants, and reviewers.",
  supportEmail: "recruitment@longhornracing.com",
} as const;

export const appConfig = {
  organization,
  metadata: {
    title: `${organization.name} | ${organization.parentName}`,
    description: organization.description,
    iconPath: "/favicon.ico",
  },
  navigation: {
    public: [
      { label: organization.shortName, href: "/" },
      { label: "Teams", href: "/teams/public" },
      { label: "FAQ", href: "/faq" },
    ],
    applicant: [{ label: "Application", href: "/application" }],
    member: [
      { label: "Applications", href: "/applications" },
      { label: "Interviews", href: "/interviews" },
    ],
    management: [
      { label: "People", href: "/people" },
      { label: "Team Management", href: "/teams" },
    ],
    admin: [
      { label: "Cycles", href: "/cycles" },
      { label: "Blacklist", href: "/admin/blacklist" },
    ],
  },
  identity: {
    verifiedEmailLabel: "Organization Email Address",
    requiredEmailDomain: "eid.utexas.edu",
    signInDescription:
      "You may sign in with any Google account, but you must verify your organization email before submitting an application.",
    resumeWarningTitle: "You have not uploaded a resume.",
    resumeWarningDescription:
      "You cannot submit applications until you upload a resume.",
    unverifiedEmailTitle: "Your organization email is not verified.",
    unverifiedEmailDescription:
      "You cannot submit applications until your email is verified.",
    reverifySuccessMessage:
      "Profile updated successfully. You need to reverify your organization email.",
    verificationSentMessage:
      "Verification email sent. Please check your inbox.",
    duplicateEmailError: "This organization email is already in use.",
    submissionRequiresVerifiedEmailMessage:
      "You must verify your organization email before submitting your application.",
    verificationPageTitle: "Verify Email",
    verificationMissingTokenMessage:
      "No verification token was provided. Please check your email for the verification link.",
    verificationAlreadyUsedMessage:
      "This verification link has already been used or is no longer needed.",
    verificationExpiredMessage:
      "The verification link has expired. Please request a new verification email.",
    verificationSuccessMessage:
      "Success! Your organization email has been verified.",
  },
  email: {
    fromName: "Longhorn Racing Recruitment",
    transactionalFromAddress: "lhr@platformzinc.dev",
    recruitingFromAddress: "longhornracingrecruitment@gmail.com",
    baseUrl: "https://recruiting.longhornracing.org",
    verificationSubject: "LHR Recruiting Email Verification",
    applicationUpdateSubjectPrefix: "Application Update for",
    interviewInviteSubjectPrefix: "Interview Scheduled for",
    interviewCalendarLabel: `${organization.name} Recruitment Interview`,
    interviewLocation: "Video Call",
  },
  pages: {
    home: {
      title: `${organization.name} Recruiting Platform`,
      description:
        `Welcome to the ${organization.name} recruiting platform. ` +
        "Use this workspace to review opportunities, submit applications, and follow each stage of the recruiting process.",
    },
    people: {
      title: "People Management",
      description:
        `Manage members, roles, and permissions for ${organization.name}.`,
    },
    application: {
      title: "Applications",
      description:
        `View and manage your applications for ${organization.name}.`,
      openMessage: "We are accepting applications.",
      closedMessage: "We're currently not accepting applications.",
    },
    teams: {
      title: "Teams",
      description:
        `View and manage organizational teams for ${organization.name}.`,
      overviewTitle: "Overview",
      overviewDescription: "Manage teams, systems, and their members.",
    },
    publicTeams: {
      title: "Teams",
      description:
        `Explore the teams within ${organization.name} and see which systems are actively recruiting.`,
      systemsHeading: "The following systems are recruiting:",
      emptySystemDescription: "No systems listed",
      learnMoreLabel: "Learn more",
    },
    profile: {
      resendVerificationLabel: "Re-send Verification Email",
      saveChangesLabel: "Save Changes",
      savingLabel: "Saving...",
    },
    applicationDetail: {
      titlePrefix: "Your",
      description: (teamName: string) =>
        `View and manage your application for the ${teamName} team. You can edit your application details, upload documents, and submit your application.`,
    },
  },
  trialWorkday: {
    intro: "As part of the next stage, please confirm your availability.",
    teams: {
      Solar: {
        label: "Schedule Solar Trial",
        href: "https://forms.gle/Wot5StyzP9HCZtiN8",
      },
      Combustion: {
        label: "Schedule Combustion Trial",
        href: "https://forms.gle/e2UZ7mdNdyjfENeG6",
      },
      Electric: {
        label: "Schedule Electric Trial",
        href: "https://forms.gle/ytKMqDeAUkTYywuDA",
      },
    },
  },
  footer: {
    copyrightYear: 2026,
    copyrightName: organization.name,
  },
} as const;

export type AppConfig = typeof appConfig;

type ApplicantCommunicationKind = "interview" | "rejected" | "waitlist";

type ApplicantCommunicationContent = {
  greeting: string;
  paragraphs: string[];
  signoff: string[];
  note?: string[];
  actionLabel?: string;
};

const applicantCommunicationTemplates: Record<
  ApplicantCommunicationKind,
  Record<string, (name: string) => ApplicantCommunicationContent>
> = {
  interview: {
    Combustion: (name) => ({
      greeting: `Dear ${name},`,
      paragraphs: [
        "Congratulations! We have been very impressed by your application and have decided to offer you an interview! Please follow the link below to view the system(s) that have extended an interview and select a single system to proceed with.",
        "You will have the option to select a time to schedule this 30-minute interview, which will be in person in the Engineering Teaching Center (ETC) lobby. We hope to see you again during your interview and please reach out if you have any questions.",
      ],
      actionLabel: "Schedule Interview",
      signoff: ["Sincerely,", "Leo Cheong"],
      note: [
        "You will see which systems you have been invited to interview with once you go to schedule an interview.",
        "If you do not have the ability to schedule an interview for another system you have applied for, you have not been extended an interview invite for that system. As a reminder, you can interview for only one system on Combustion.",
        "Please schedule your interview at least 12 hours in advance of the interview time, otherwise it will be rescheduled. All Combustion interviews will be at the ETC. There will be a check-in table and/or signs to guide you.",
      ],
    }),
    Electric: (name) => ({
      greeting: `Congratulations, ${name}!`,
      paragraphs: [
        `After reviewing your application, we’re excited to invite you to interview for ${organization.name} Electric. Please follow the link below to reserve an interview time with your designated system.`,
        "We look forward to meeting you!",
      ],
      actionLabel: "Schedule Interview",
      signoff: ["Sincerely,", "Tyler Yan", "LHRe Team Captain"],
      note: [
        "You will see which systems you have been invited to interview with once you go to schedule an interview.",
        "If you do not have the ability to schedule an interview for another system you have applied for, you have not been extended an interview invite for that system. As a reminder, you can interview for only one system on Electric.",
        "Please schedule your interview at least 12 hours in advance of the interview time, otherwise it will be rescheduled. All Electric team interviews will take place in the EER (second floor entrance). There will be a check-in table and/or signs to guide you.",
      ],
    }),
    Solar: (name) => ({
      greeting: `Dear ${name},`,
      paragraphs: [
        `Congratulations! You have been accepted into the next stage of the application process for ${organization.name} Solar. We have reviewed your written application and have decided to move you forward to the interviewing process for one or more systems.`,
        "Should you choose to accept this, you will be interviewed for 30 minutes by two members of our team.",
        `Please schedule below. If you have questions or need clarification, please contact ${organization.supportEmail}.`,
      ],
      actionLabel: "Schedule Interview",
      signoff: ["Best,", "Kayla Lee", `${organization.name} Solar Team Captain`],
      note: [
        "You will see which systems you have been invited to interview with once you go to schedule an interview.",
        "If you do not have the ability to schedule an interview for another system you have applied for, you have not been extended an interview invite for that system. As a reminder, you can interview for as many systems as you are accepted for on Solar.",
        "Please schedule your interview at least 12 hours in advance of the interview time, otherwise it will be rescheduled. All Solar interviews will be at the ETC. There will be a check-in table and/or signs to guide you.",
      ],
    }),
  },
  rejected: {
    Electric: (name) => ({
      greeting: `Hello ${name},`,
      paragraphs: [
        `Thank you for your interest in ${organization.name} Electric. After careful consideration, we’ve decided not to proceed with your application.`,
        "This decision was not an easy one, as we received many strong applicants this year. We encourage you to reapply in future recruiting seasons and wish you the best in any other ongoing recruitment processes.",
      ],
      signoff: ["Sincerely,", "Tyler Yan", "LHRe Team Captain"],
    }),
    Combustion: (name) => ({
      greeting: `Dear ${name},`,
      paragraphs: [
        `Thank you so much for your interest in the ${organization.name} Combustion team. Unfortunately, after careful consideration, we are unable to move forward with your application at this time.`,
        `Please understand that this is not a reflection on your talents, abilities, or personality; ${organization.name} has had an ever-increasing number of applicants every year and with that a harder decision to make in selecting new members.`,
        `We hope that you enjoyed learning more about the team and you’ll reapply in the future. If you believe that you have received this message by mistake, please reach out to ${appConfig.email.recruitingFromAddress}.`,
      ],
      signoff: ["Sincerely,", "Leo Cheong"],
    }),
    Solar: (name) => ({
      greeting: `Dear ${name},`,
      paragraphs: [
        `It is with genuine regret that I must tell you that you have not been selected as a member of ${organization.name} Solar this year.`,
        "I know it is extremely frustrating to be rejected from a role for which you are perfectly qualified. We believe everyone who applied this semester has clearly shown themselves to be hardworking, driven, curious, intelligent, and passionate about engineering. I have no doubt that any one of you would have been an asset to our team.",
        `Each year we surpass our previous record for the number of unique applicants, and that means we are forced to make difficult decisions at every step of the process. At the end of the day, there are simply more qualified applicants than there are spots on each team. If you remain interested in being a member of ${organization.shortName}S, we urge you to reapply next year.`,
        "Thank you very much for the time and effort you’ve put in thus far, and we wish you the best.",
      ],
      signoff: ["Sincerely,", "Kayla Lee", `${organization.name} Solar Team Captain`],
    }),
  },
  waitlist: {
    Solar: (name) => ({
      greeting: `Dear ${name},`,
      paragraphs: [
        "We hope this message finds you well. I am sorry to inform you that you have not been offered an immediate position on the Solar team. However, you have been placed on the waitlist.",
        "I would like to extend my appreciation to you for the efforts you have made to get this far in the process. We were thoroughly impressed by your energy and display of skills. I have no doubt that you would be a great addition to the team.",
        `We hope to get back to you very soon, so please look out for a follow up. Thank you again for your interest in our team. If you have any concerns or questions, please contact us at ${organization.supportEmail}.`,
      ],
      signoff: ["Best Regards,", "Kayla Lee", `${organization.name} Solar Team Captain`],
    }),
    Electric: () => ({
      greeting: "Hello,",
      paragraphs: [
        `Thank you for attending ${organization.name} Electric’s trial workday. We greatly appreciate your time participating in our interview and selection process.`,
        "Due to the competitive nature of this admissions cycle, and the limited number of available slots, we have temporarily placed your application on our waitlist.",
        "Thank you for your understanding, and rest assured that we will notify you shortly regarding any updates to your application.",
      ],
      signoff: ["Sincerely,", "Tyler Yan", "LHRe Team Captain"],
    }),
    Combustion: (name) => ({
      greeting: `Dear ${name},`,
      paragraphs: [
        `We appreciate the enthusiasm and effort you put into the recruitment process for the ${organization.name} Combustion team. While we are currently not able to offer an invitation to join, we are pleased to let you know you have been placed on the waitlist for your system.`,
        "Please visit our recruitment portal to view the status of your waitlist. As soon as a position opens on the system, you will receive an invitation to join the team.",
        `We hope that this does not discourage you, as you have made it through a demanding application process and that is an achievement you should be proud of. If you have any questions or concerns, please reach out to ${organization.supportEmail}.`,
      ],
      signoff: ["Sincerely,", "Leo Cheong"],
    }),
  },
};

const fallbackApplicantCommunications: Record<
  ApplicantCommunicationKind,
  (name: string) => ApplicantCommunicationContent
> = {
  interview: (name) => ({
    greeting: `Dear ${name},`,
    paragraphs: [
      `Congratulations! You have been selected to move forward in the ${organization.name} interview process.`,
      "Please use the scheduling link below to select an available interview time.",
    ],
    actionLabel: "Schedule Interview",
    signoff: ["Best,", appConfig.email.fromName],
  }),
  rejected: (name) => ({
    greeting: `Dear ${name},`,
    paragraphs: [
      `Thank you for your interest in ${organization.name}. After careful consideration, we will not be moving forward with your application at this time.`,
      "We appreciate the time and effort you invested in the process and encourage you to reapply in the future.",
    ],
    signoff: ["Best,", appConfig.email.fromName],
  }),
  waitlist: (name) => ({
    greeting: `Dear ${name},`,
    paragraphs: [
      `Thank you for your continued interest in ${organization.name}. We are not able to offer an immediate position at this time, but your application remains under consideration.`,
      "We will follow up as soon as there is an update to share.",
    ],
    signoff: ["Best,", appConfig.email.fromName],
  }),
};

export const getApplicantCommunication = (
  kind: ApplicantCommunicationKind,
  team: string,
  name: string,
) =>
  applicantCommunicationTemplates[kind][team]?.(name) ??
  fallbackApplicantCommunications[kind](name);

export const getTrialWorkdayConfig = (team: string) =>
  appConfig.trialWorkday.teams[
    team as keyof typeof appConfig.trialWorkday.teams
  ] ?? null;
