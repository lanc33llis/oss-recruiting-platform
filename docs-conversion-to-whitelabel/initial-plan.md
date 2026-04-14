# Repository Generalization Plan

This document outlines the required steps to fully generalize this recruiting platform so that it can be seamlessly deployed for any company, club, or organization (white-labeling) simply by adjusting configuration files and environment variables.

## 0. Implementation Order & Clean-Slate Assumptions

This plan is broad enough that implementation order matters. This effort is being treated as a clean-slate generalization project, not a live production migration. The goal is to replace hardcoded assumptions with configurable primitives in a deliberate order so the generalized architecture stays coherent.

- **Checklist:**
  - [ ] Execute the work in phases: branding/config cleanup -> feature-flag enforcement -> terminology abstraction -> auth/role generalization -> schema reshaping -> admin tooling -> advanced modules (rubrics, pairwise ranking, integrations).
  - [ ] Decide which existing concepts should be replaced outright versus temporarily wrapped by compatibility layers during implementation.
  - [ ] Preserve the core product workflows as the architecture is generalized: authentication, application submission, reviewer workflows, interview scheduling, and email delivery.
  - [ ] Prefer direct schema redesign over transitional compatibility work unless a temporary bridge materially reduces implementation complexity.

## 0.1 Deployment Model & Tenant Boundary

The plan should explicitly decide whether this product is intended to be single-tenant-per-deploy, or eventually support multiple organizations in one database/runtime.

- **Checklist:**
  - [ ] Decide the deployment model up front: single-tenant deployment or multi-tenant platform.
  - [ ] If multi-tenant is even a future possibility, add `organizationId` scoping to all primary domain models now instead of relying only on table prefixes.
  - [ ] Define separation requirements for uploads, generated assets, public branding assets, email identities, and environment variables per organization.
  - [ ] Document tenant-boundary rules for queries, caching, background jobs, and webhook delivery.

## 1. Centralized Configuration (`src/config.ts`)

The foundation for generalization has been laid out in `config.ts`. Moving forward, **no organization-specific strings, URLs, or colors should be hardcoded in React components.**

- **Checklist:**
  - [ ] Ensure all React Server Components (RSC) and Client Components pull metadata (names, taglines) exclusively from `config.ts`.
  - [ ] Theming and colors should be managed directly through standard CSS variables (`globals.css`) instead of via `config.ts`.
  - [ ] Ensure footer and header components dynamically render the links from `config.social` and `config.navigation`.
  - [ ] Clearly separate deploy-time branding config from runtime admin-managed content. `config.ts` should hold safe defaults and branding primitives, while mutable org structures/statuses/templates should live in the database.

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
  - [ ] **Template Versioning:** Add form schema versioning so previously submitted applications remain readable even after templates evolve.
  - [ ] **Remove Org-Specific Fields:** The `users` table currently contains `eidEmail` and `eidEmailVerified` (UT Austin specific). These must be renamed to a generic `orgEmail` and `orgEmailVerified`.
  - [ ] **Flexible Organizational Hierarchy:** The hardcoded `Team` -> `System` structure (where a System belongs to a Team) is too rigid. Migrate to a generic `OrganizationUnit` or `Group` model with parent/child relationships (e.g., `parentId`) to support _any_ organizational depth (e.g., Company -> Department -> Team).
  - [ ] **Dynamic State Machines:** Remove `applicationStatusEnum` and `applicationCycleStatusEnum` from Postgres. The state machine for applications should be driven by the custom `ApplicationTemplate` or Cycle configurations.
  - [ ] **Transition Validation:** Define explicit state transition rules, terminal states, and reviewer permissions so dynamic statuses do not become arbitrary or unsafe.
  - [ ] **Positions / Roles Table:** Introduce a core `Position` (or `JobRequisition`) table that links to an `OrganizationUnit`. This table will hold the `ApplicationTemplate`, the `HiringMode` (Rolling vs Fixed), and the custom `Statuses`.
  - [ ] **Schema Reset Assumptions:** Treat `eidEmail` rename, enum removal, and hierarchy reshaping as direct schema redesign tasks unless test fixtures or import scripts require temporary mapping utilities.

## 4. Authentication & Access Control

The platform uses NextAuth. Access control needs to be flexible and deeply customizable.

- **Checklist:**
  - [ ] **Comprehensive Admin Solution:** Build a deeply customizable admin panel to manage users, teams, templates, and timelines dynamically.
  - [ ] **Dynamic Role Mapping:** Role mapping should be dynamic (configurable through the admin panel) while generally guaranteeing core roles like `APPLICANT` and `ADMIN`. Ensure `getNavLinks` and middleware enforce these robustly.
  - [ ] **Permission Matrix:** Model permissions separately from display roles so orgs can customize capabilities without encoding every combination into role names.
  - [ ] **Identity Policy Generalization:** Remove UT/EID-specific assumptions from auth and profile flows. Org-email verification, allowed domains, invitation-only access, and provider choices should be configurable organization policy, not hardcoded behavior.
  - [ ] **Audit Logging:** Record role changes, permission changes, template edits, status changes, and evaluation updates for accountability.

## 5. SEO & Document Metadata

Page titles, descriptions, and OpenGraph images need to represent the deploying organization.

- **Checklist:**
  - [ ] Update `src/app/layout.tsx` to dynamically generate the Next.js `metadata` export using `config.org.name` and `config.org.description`.
  - [ ] Generate a generic or configurable `/public/opengraph-image.png` that can be easily swapped out by the deploying organization.
  - [ ] Ensure `robots.txt` and `sitemap.ts` are dynamically generated based on whether public teams/applications are enabled in `config.app`.
  - [ ] Audit and generalize all public brand assets and static metadata surfaces, including `favicon`, social preview assets, and any `.well-known` files that may currently assume a specific organization or deployment.

## 6. Email Templates & Communications

If the platform sends automated emails (e.g., application received, interview scheduled), the templates must be agnostic.

- **Checklist:**
  - [ ] Create a standardized wrapper for all outgoing emails that uses `config.org.logo` in the header and `config.email.fromName` as the sender.
  - [ ] Ensure footer addresses in emails use the organization's name and copyright year from `config.ts`.
  - [ ] Separate sender identity, reply-to address, and compliance/legal footer content per organization.
  - [ ] Externalize applicant-facing communication copy across updates, interview invites, rejections, waitlist decisions, and reminders so org-specific messaging is not embedded directly in React/email template files.

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
  - [ ] Decide how rubric scores interact with stage transitions, reviewer permissions, and applicant ranking so scoring remains actionable.

## 9. Interview & Scheduling Modularity

The current `events` and `interviews` tables are rigid. Companies often use async video interviews or external tools (like Calendly), while clubs might use a manual "Sign up for a timeslot" flow.

- **Checklist:**
  - [ ] Abstract the interview module to support multiple "Interview Types" (e.g., `MANUAL_SCHEDULING`, `EXTERNAL_LINK`, `ASYNC_VIDEO`).
  - [ ] Ensure interview scheduling, reminders, and reviewer workflows do not depend on fixed `teamId` / `systemId` assumptions once the organizational model is generalized.

## 10. Webhooks & Integrations

Generalized platforms must play nicely with external ecosystems.

- **Checklist:**
  - [ ] Build a webhooks or integrations table so organizations can trigger Discord, Slack, or email notifications when an application is submitted or a status changes.
  - [ ] Add signing/secrets, retry policies, delivery logs, and idempotency guarantees for outbound integrations.

## 11. Applicant Ranking & Sorting (ELO/Pairwise)

A simple 1-5 rubric isn't always enough to identify the best candidates. Implementing an ELO-based or pairwise comparison system helps reviewers dynamically rank applicants against each other.

- **Checklist:**
  - [ ] Implement a pairwise comparison UI for reviewers (e.g., "Who is the better candidate? A or B?").
  - [ ] Store ELO ratings or relative rankings dynamically per `Position` or `ApplicationCycle`.
  - [ ] Allow this feature to be toggled per stage (e.g., highly useful during Interview stages, but optionally available for initial Resume Screening).

## 12. Public Content & Org-Specific Workflow Cleanup

White-labeling is not only schema and auth work. The current repository also contains org-specific storytelling, applicant guidance, and workflow assumptions that must be pulled out of page/component code.

- **Checklist:**
  - [ ] Remove hardcoded organization names, school-specific language, and team-specific recruiting copy from public pages, dashboards, and applicant views.
  - [ ] Re-evaluate whether the current blacklist feature should remain an EID-specific restriction list or become a broader applicant restriction / blocked-identity model.
  - [ ] Ensure public org/unit pages describe generalized organization structures rather than assuming the current Longhorn Racing layout.
  - [ ] Clearly separate deploy-time defaults from admin-managed runtime content for public copy and applicant communications.

## 13. Testing & Fixture Organizations

Generalization work should be proven against multiple realistic organization shapes, not just the current data model.

- **Checklist:**
  - [ ] Create fixture org configurations for at least three scenarios: student org / club, startup / company, and multi-level enterprise.
  - [ ] Add smoke tests for the main user journeys in each fixture: apply, review, schedule, evaluate, and communicate.
  - [ ] Add schema and fixture tests that validate the generalized model works for multiple organization shapes from a clean setup.

## 14. Definition of Done

The project should not be considered fully generalized until a new organization can launch without source changes.

- **Checklist:**
  - [ ] A new organization can be configured with branding, terminology, navigation, links, and feature flags without editing React components.
  - [ ] A new organization can define its own hierarchy, positions, statuses, templates, and rubric structure without schema edits.
  - [ ] Auth, permissions, and public/private routes behave correctly for at least the fixture organizations.
  - [ ] The generalized architecture can be initialized cleanly for a brand-new organization without source changes or one-off schema edits.
