# Repository Generalization Plan

This document outlines the required steps to fully generalize this recruiting platform so that it can be seamlessly deployed for any company, club, or organization (white-labeling) simply by adjusting configuration files and environment variables.

## 1. Centralized Configuration (`src/config.ts`)

The foundation for generalization has been laid out in `config.ts`. Moving forward, **no organization-specific strings, URLs, or colors should be hardcoded in React components.**

- **Checklist:**
  - [ ] Ensure all React Server Components (RSC) and Client Components pull metadata (names, taglines) exclusively from `config.ts`.
  - [ ] Theming and colors should be managed directly through standard CSS variables (`globals.css`) instead of via `config.ts`.
  - [ ] Ensure footer and header components dynamically render the links from `config.social` and `config.navigation`.

## 2. Terminology & Verbiage Localization

Different organizations and companies use different terminology. Currently, the codebase uses terms like `System` and `Team`.

- **Checklist:**
  - [ ] **Structural Terminology:** Ensure internal vocabulary is flexible. For example, if a company calls "Systems" -> "Departments" or "Pods", consider adding a terminology mapping object in `config.ts` so the UI reflects the actual structure.
  - [ ] **Dynamic Hiring Modes:** "Timelines" should be a mode attached to a "Position" or "Role". Support both _Rolling_ (open until filled, common in companies) and _Fixed/Cohort_ (strict deadlines, common in clubs/schools) recruitment modes.
  - [ ] **Application Statuses:** Statuses (`DRAFT`, `SUBMITTED`, `REVIEWED`, `ACCEPTED`, `REJECTED`) should be fully customizable per team/cycle. Different entities have different review pipelines (e.g., "Waitlisted", "First Round Passed", "Offer Extended").

## 3. Database Generalization (`drizzle.config.ts` & `schema.ts`)

The database schema currently uses the `rp_` (Recruiting Platform) table prefix and a rigid role system.

- **Checklist:**
  - [ ] **Table Prefix:** Consider extracting the `rp_` prefix in `src/server/db/schema.ts` to an environment variable (e.g., `DB_PREFIX`) so multiple instances of the app could theoretically share a single database without collisions.
  - [ ] **Application Templates:** Implement an `ApplicationTemplate` database model. Each team or unit should be able to create custom application forms that derive from these base templates.
  - [ ] **Remove Org-Specific Fields:** The `users` table currently contains `eidEmail` and `eidEmailVerified` (UT Austin specific). These must be renamed to a generic `orgEmail` and `orgEmailVerified`.
  - [ ] **Flexible Organizational Hierarchy:** The hardcoded `Team` -> `System` structure (where a System belongs to a Team) is too rigid. Migrate to a generic `OrganizationUnit` or `Group` model with parent/child relationships (e.g., `parentId`) to support _any_ organizational depth (e.g., Company -> Department -> Team).
  - [ ] **Dynamic State Machines:** Remove `applicationStatusEnum` and `applicationCycleStatusEnum` from Postgres. The state machine for applications should be driven by the custom `ApplicationTemplate` or Cycle configurations.
  - [ ] **Positions / Roles Table:** Introduce a core `Position` (or `JobRequisition`) table that links to an `OrganizationUnit`. This table will hold the `ApplicationTemplate`, the `HiringMode` (Rolling vs Fixed), and the custom `Statuses`.

## 4. Authentication & Access Control

The platform uses NextAuth. Access control needs to be flexible and deeply customizable.

- **Checklist:**
  - [ ] **Comprehensive Admin Solution:** Build a deeply customizable admin panel to manage users, teams, templates, and timelines dynamically.
  - [ ] **Dynamic Role Mapping:** Role mapping should be dynamic (configurable through the admin panel) while generally guaranteeing core roles like `APPLICANT` and `ADMIN`. Ensure `getNavLinks` and middleware enforce these robustly.

## 5. SEO & Document Metadata

Page titles, descriptions, and OpenGraph images need to represent the deploying organization.

- **Checklist:**
  - [ ] Update `src/app/layout.tsx` to dynamically generate the Next.js `metadata` export using `config.org.name` and `config.org.description`.
  - [ ] Generate a generic or configurable `/public/opengraph-image.png` that can be easily swapped out by the deploying organization.
  - [ ] Ensure `robots.txt` and `sitemap.ts` are dynamically generated based on whether public teams/applications are enabled in `config.app`.

## 6. Email Templates & Communications

If the platform sends automated emails (e.g., application received, interview scheduled), the templates must be agnostic.

- **Checklist:**
  - [ ] Create a standardized wrapper for all outgoing emails that uses `config.org.logo` in the header and `config.email.fromName` as the sender.
  - [ ] Ensure footer addresses in emails use the organization's name and copyright year from `config.ts`.

## 7. Feature Flags Integration

The platform supports enabling/disabling applications, public teams, and interviews via `config.app`.

- **Checklist:**
  - [ ] Integrate `isFeatureEnabled('applications')` into the middleware or page layouts to return a 404 or "Applications Closed" component if accessed when disabled.
  - [ ] Do the same for interviews (`isFeatureEnabled('interviews')`). Hide the dashboard UI elements for these features entirely when toggled off to prevent user confusion.

## 8. Evaluation & Scoring (Rubrics)

Organizations evaluate candidates differently. A simple "Reviewed" status isn't enough; teams need custom grading criteria.

- **Checklist:**
  - [ ] Implement an `EvaluationRubric` model tied to a `Position` or `ApplicationTemplate`.
  - [ ] Allow admins to define custom scoring metrics (e.g., 1-5 Technical, 1-5 Behavioral, or simple pass/fail flags).

## 9. Interview & Scheduling Modularity

The current `events` and `interviews` tables are rigid. Companies often use async video interviews or external tools (like Calendly), while clubs might use a manual "Sign up for a timeslot" flow.

- **Checklist:**
  - [ ] Abstract the interview module to support multiple "Interview Types" (e.g., `MANUAL_SCHEDULING`, `EXTERNAL_LINK`, `ASYNC_VIDEO`).

## 10. Webhooks & Integrations

Generalized platforms must play nicely with external ecosystems.

- **Checklist:**
  - [ ] Build a webhooks or integrations table so organizations can trigger Discord, Slack, or email notifications when an application is submitted or a status changes.

## 11. Applicant Ranking & Sorting (ELO/Pairwise)

A simple 1-5 rubric isn't always enough to identify the best candidates. Implementing an ELO-based or pairwise comparison system helps reviewers dynamically rank applicants against each other.

- **Checklist:**
  - [ ] Implement a pairwise comparison UI for reviewers (e.g., "Who is the better candidate? A or B?").
  - [ ] Store ELO ratings or relative rankings dynamically per `Position` or `ApplicationCycle`.
  - [ ] Allow this feature to be toggled per stage (e.g., highly useful during Interview stages, but optionally available for initial Resume Screening).
