# White-Label Implementation Plan

This document translates the high-level generalization strategy into an execution plan for this repository. It is intentionally repo-specific: each phase calls out the current code hotspots, the architectural decisions to make, and the acceptance criteria required before moving on.

This project is being treated as a clean-slate white-label redesign, not a live-production migration. We should prefer coherent replacement over temporary compatibility layers unless a short-lived bridge materially reduces implementation risk inside the repo.

## 0. Ground Rules

- Keep the application usable while refactoring the internals. The critical workflows to preserve are sign-in, profile completion, application submission, reviewer actions, interview scheduling, and outbound email delivery.
- Avoid spreading new configuration patterns ad hoc. Every new white-label concept should have a clear home:
  - deploy-time branding and feature defaults in `src/config.ts`
  - mutable organization data in the database
  - auth/provider secrets in `src/env.js`
  - UI theme tokens in CSS variables
- Prefer replacing org-specific concepts at the model boundary first, then simplifying page and component code afterward.
- Do not let new work deepen the current `teamId` / `systemId` / `eidEmail` assumptions while the redesign is in progress.

## 1. Target Outcomes

By the end of this effort, a new organization should be able to launch without source edits by configuring:

- brand name, metadata, links, logos, and public assets
- allowed auth providers and org-email verification policy
- organization structure and terminology
- positions, forms, statuses, review flow, and interview mode
- permissions, admin roles, and public/private feature flags
- email sender identity and applicant communications

## 2. Delivery Approach

Work should happen in this order:

1. Establish the white-label configuration boundary.
2. Remove hardcoded org copy and metadata from the app shell and public-facing pages.
3. Generalize identity, verification, and email sender behavior.
4. Redesign the domain model away from `Team -> System` and EID-specific fields.
5. Rebuild RBAC and admin workflows around the new generalized model.
6. Generalize application forms, statuses, rubricing, and interview flows.
7. Add fixture-org validation and final polish.

Each phase below should land in a reviewable slice with working acceptance checks.

## 3. Phase 1: Config Boundary and Brand Surface

### Objective

Make `src/config.ts` the single obvious place for deploy-time branding and default behavior, and remove hardcoded organization strings from top-level UI surfaces.

### Primary files

- `src/config.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/people/page.tsx`
- `src/app/application/page.tsx`
- `src/app/teams/page.tsx`
- `src/app/teams/public/page.tsx`
- `public/favicon.ico`
- `public/.well-known/microsoft-identity-association.json`

### Work

- Define the exact deploy-time config shape for:
  - organization name, short name, description, URLs, and support contact
  - navigation and social links
  - public metadata defaults
  - feature flags
  - terminology labels
- Update `src/app/layout.tsx` to generate metadata from config instead of hardcoded Longhorn Racing values.
- Replace hardcoded org copy on landing and dashboard-adjacent pages with config-driven content or admin-managed content placeholders.
- Decide how public assets are overridden per deployment:
  - checked-in defaults
  - environment-selected asset set
  - storage-backed runtime assets
- Catalog every `.well-known`, favicon, and social-preview asset that may need tenant-specific replacement.

### Acceptance criteria

- No top-level page or metadata export contains hardcoded Longhorn Racing or UT Austin copy.
- The app shell renders correctly using only config-driven branding.
- Public assets have a documented override path per deployment.

## 4. Phase 2: Identity, Verification, and Email Policy

### Objective

Remove UT/EID-specific identity rules and replace them with configurable organization identity primitives.

### Primary files

- `src/env.js`
- `src/server/auth/config.ts`
- `src/app/profile/actions.ts`
- `src/app/profile/_components/ProfileForm.tsx`
- `src/app/_components/sign-in-dialog.tsx`
- `src/app/_components/header-client.tsx`
- `src/app/verify/[token]/page.tsx`
- `src/app/application/[applicationId]/page.tsx`
- `src/app/api/update/route.ts`
- `src/app/api/update/template.tsx`
- `src/app/interview/actions.ts`

### Work

- Replace `eidEmail` / `eidEmailVerified` concepts in the product language with generic organization email verification terminology.
- Decide whether org-email verification is:
  - required
  - optional
  - domain-restricted
  - invitation-based
- Move domain validation logic out of page/action-specific code and into a shared policy layer.
- Generalize user-facing sign-in and verification text to reference configurable provider and email policy details.
- Standardize outbound email sender identity:
  - from name
  - from address
  - reply-to
  - footer/legal text
  - app URLs in email templates
- Audit all transactional email templates and server actions for hardcoded org names, domains, and URLs.

### Acceptance criteria

- No auth or verification flow assumes `@eid.utexas.edu`.
- Email templates and sender identity are derived from generalized config or database-backed organization settings.
- The app can express at least two different verification policies without code changes.

## 5. Phase 3: Domain Model Redesign

### Objective

Replace rigid org-specific schema concepts with generalized entities that support multiple organization shapes.

### Primary files

- `src/server/db/schema.ts`
- `drizzle.config.ts`
- `src/server/api/routers/applications.ts`
- `src/server/api/routers/systems.ts`
- `src/server/api/routers/teams.ts`
- `src/server/api/routers/availabilities.ts`
- `src/server/api/routers/people.ts` if introduced or split later

### Work

- Decide the core hierarchy model:
  - `Organization`
  - `OrganizationUnit` with `parentId`
  - `Position`
  - optional `PositionCycle` or cohort model
- Replace `Team` and `System` assumptions with a generalized hierarchy and assignment model.
- Replace `eidEmail` and `blacklistedEids` with more generic equivalents:
  - `orgEmail`
  - restricted identities / blocked applicants / denied domains depending on product intent
- Remove enum-driven application stages where they block organization-specific pipelines.
- Introduce data models for:
  - application templates
  - template versions
  - custom statuses
  - status transition rules
  - rubric definitions
- Decide whether the product is single-tenant-per-deploy or future multi-tenant. If multi-tenant remains plausible, add `organizationId` to primary models now.

### Acceptance criteria

- The schema can model a student org, a startup hiring team, and a multi-level enterprise org without source edits.
- Core data models no longer encode UT/EID assumptions.
- Application stages and positions are configurable without adding new enums to the schema.

## 6. Phase 4: RBAC and Admin Model

### Objective

Rebuild access control around capabilities and scopes instead of the current fixed role plus `teamId/systemId` coupling.

### Primary files

- `src/server/lib/rbac.ts`
- `src/server/auth/config.ts`
- `src/app/people/actions.ts`
- `src/app/people/page.tsx`
- `src/app/people/_components/UserRoleTeamForm.tsx`
- `src/app/teams/actions.ts`
- `src/app/teams/[teamId]/page.tsx`
- `src/app/systems/[systemId]/page.tsx`
- middleware and nav helpers wherever route protection is currently encoded

### Work

- Define the permission model separately from display roles.
- Replace direct `teamId` and `systemId` assumptions in RBAC with scoped permissions over generalized units and positions.
- Redesign the admin assignment UI around the new hierarchy model.
- Add audit logging for:
  - role and permission changes
  - organization-unit changes
  - status configuration changes
  - rubric and template edits
- Ensure navigation and route guards consume the same permission primitives.

### Acceptance criteria

- Route access and UI controls are derived from a shared permission model.
- Admin tooling can assign users to generalized org units and permissions, not only teams/systems.
- The app supports at least one org with simple roles and one org with more granular reviewer/admin scopes.

## 7. Phase 5: Applications, Statuses, and Reviewer Workflow

### Objective

Generalize applicant intake and review so each organization can define its own forms and pipeline stages.

### Primary files

- `src/app/application/[applicationId]/page.tsx`
- `src/app/applications/page.tsx`
- `src/app/applications/actions.tsx`
- `src/app/applications/_components/*`
- `src/server/api/routers/applications.ts`
- form-related schema and any future template admin UI

### Work

- Introduce configurable application templates tied to positions or cycles.
- Add template versioning so old submissions remain readable.
- Replace fixed status handling with organization-configurable states and transitions.
- Generalize reviewer actions, filters, highlight colors, and decision states away from system-specific assumptions.
- Decide which content is deploy-time default vs admin-managed runtime content.

### Acceptance criteria

- A position can have a custom form and custom review stages without source edits.
- Reviewer tooling works against generalized states rather than hardcoded enums and `systemId` maps.
- Old application records remain readable after template changes.

## 8. Phase 6: Interviews, Scheduling, and Communications

### Objective

Support multiple interview models and remove team-specific communication logic from interview workflows.

### Primary files

- `src/app/interview/page.tsx`
- `src/app/interview/actions.ts`
- `src/app/interview/_components/*`
- `src/app/interviews/actions.ts`
- `src/app/interviews/_components/*`
- `src/server/api/routers/availabilities.ts`
- `src/server/db/schema.ts`

### Work

- Replace team-specific interview behavior with configurable interview types:
  - manual scheduling
  - self-serve slot selection
  - external scheduling link
  - async interview
- Generalize availability ownership from `systemId` toward the new org unit / position model.
- Move all interview email copy to generalized templates.
- Document how interview scheduling interacts with statuses and permissions.

### Acceptance criteria

- At least two interview modes are supported without code changes.
- Scheduling, reminders, and interviewer/admin actions do not reference Longhorn Racing-specific concepts.

## 9. Phase 7: Public Pages, Assets, and Optional Modules

### Objective

Finish the remaining white-label surface area and clearly isolate optional advanced features.

### Primary files

- `src/app/teams/public/page.tsx`
- `src/app/api/update/*`
- `src/app/admin/blacklist/*`
- `src/app/application/[applicationId]/_components/interview.tsx`
- `src/app/application/[applicationId]/_components/rejected.tsx`
- `src/app/application/[applicationId]/_components/waitlist.tsx`
- future webhook, rubric, and ranking modules

### Work

- Replace org-specific public-team storytelling with generalized public org/position presentation.
- Reframe or remove blacklist functionality if the product really needs a more generic blocked-applicant or restricted-identity model.
- Externalize applicant-facing acceptance, rejection, waitlist, and update messaging.
- Split advanced modules behind clear feature flags:
  - rubrics
  - pairwise ranking / ELO
  - webhook integrations
  - external notifications

### Acceptance criteria

- Public-facing pages and applicant communications are generalized.
- Optional modules are clearly isolated behind config or admin-managed feature flags.

## 10. Fixture Organizations and Validation

We should validate the redesign against concrete shapes, not abstract flexibility.

### Required fixture organizations

- Student org / club
  - multi-team recruiting
  - org-email verification required
  - fixed-cycle recruiting
- Startup / company
  - simple department structure
  - rolling positions
  - external scheduling
- Enterprise / multi-level org
  - nested units
  - granular reviewer permissions
  - multiple active positions and custom statuses

### Validation checks

- Sign-in and profile setup
- Public browsing experience
- Application submission
- Reviewer scoring and status transitions
- Interview scheduling
- Transactional emails
- Feature-flag visibility and route protection

## 11. Questions to Settle Early

These should be answered before or during Phase 3, not at the end:

- Is the product single-tenant-per-deploy, or should we preserve a path to true multi-tenant data scoping?
- Are organization terms purely presentational, or do some terms imply different workflows?
- Is org-email verification a universal concept, or just one optional trust mechanism?
- Does every position need a cycle, or can positions be permanently rolling?
- Should statuses be modeled per position, per cycle, or per template?
- Is blacklist behavior actually part of the future product, or should it become a broader applicant restriction system?
- Which content must be editable by admins at runtime versus shipped in deploy-time config?

## 12. Suggested Milestones

The phases above are still broad. To make them executable, we should break them into reviewable milestones and PR-sized slices.

### Progress Snapshot

- [~] Milestone 1: Brand and Config Boundary
- [~] Milestone 2: Identity and Communications Policy
- [ ] Milestone 3: Schema Direction Lock-In
- [ ] Milestone 4: Core Schema and Data Access Rewrite
- [ ] Milestone 5: RBAC and Admin Rebuild
- [ ] Milestone 6: Application Workflow Generalization
- [ ] Milestone 7: Interview and Scheduling Rewrite
- [~] Milestone 8: Public Content, Optional Modules, and Validation

Current implementation notes:

- [x] Added repo-level implementation guidance in `AGENTS.md`
- [x] Created `src/config.ts` as the central deploy-time branding/config boundary
- [x] Moved layout metadata, header navigation, footer branding, and top-level page copy onto config-backed values
- [~] Began Milestone 2 by centralizing auth/profile verification copy and basic email policy defaults
- [ ] Public asset override strategy is still undocumented
- [~] Moved update, interview, and applicant communication rendering onto config-backed templates

### Milestone 1: Brand and Config Boundary

#### Goal

Remove hardcoded org identity from the app shell and establish the deploy-time config contract.

#### Tasks

- Define and document the target `src/config.ts` shape for:
  - org identity
  - support/contact info
  - feature flags
  - terminology labels
  - metadata defaults
- Refactor `src/app/layout.tsx` to use config-driven metadata.
- Replace hardcoded org copy in:
  - `src/app/page.tsx`
  - `src/app/people/page.tsx`
  - `src/app/application/page.tsx`
  - `src/app/teams/page.tsx`
  - `src/app/teams/public/page.tsx`
- Decide and document how deployment-specific public assets are supplied.
- Audit `public/` for org-bound assets and record what must become replaceable.

#### Suggested PR slices

1. Config shape and metadata refactor
2. Public/dashboard copy cleanup
3. Asset override documentation and placeholder assets

#### Exit criteria

- No top-level page or app metadata contains Longhorn Racing or UT Austin copy.
- `src/config.ts` is the obvious source of deploy-time branding truth.

### Milestone 2: Identity and Communications Policy

#### Goal

Generalize org-email verification, auth messaging, and transactional sender identity.

#### Tasks

- Replace UI language around `eidEmail` with generic org-email verification terminology.
- Introduce a shared identity-policy abstraction for:
  - required vs optional org email
  - allowed domain enforcement
  - invitation-only access
- Refactor auth/profile messaging in:
  - `src/app/profile/actions.ts`
  - `src/app/profile/_components/ProfileForm.tsx`
  - `src/app/_components/sign-in-dialog.tsx`
  - `src/app/_components/header-client.tsx`
  - `src/app/verify/[token]/page.tsx`
- Generalize sender identity and URLs in:
  - `src/app/api/update/route.ts`
  - `src/app/api/update/template.tsx`
  - `src/app/interview/actions.ts`
- Decide which settings belong in env vs org config vs database.

#### Suggested PR slices

1. Shared org-email policy layer
2. Auth/profile UI cleanup
3. Transactional email and sender identity cleanup

#### Exit criteria

- No verification flow assumes `@eid.utexas.edu`.
- Outbound email identity is configurable and not hardcoded in action/template files.

### Milestone 3: Schema Direction Lock-In

#### Goal

Make the core data model decisions before touching broad workflow code.

#### Tasks

- Finalize the target hierarchy model:
  - `Organization`
  - `OrganizationUnit`
  - `Position`
  - optional `PositionCycle`
- Decide whether `organizationId` is required now.
- Decide what replaces:
  - `Team`
  - `System`
  - `blacklistedEids`
  - enum-based statuses
- Define target models for:
  - templates
  - template versions
  - statuses
  - transitions
  - rubrics
- Write the target schema outline into the docs before implementation starts.

#### Suggested PR slices

1. Architecture decision pass in docs
2. Schema draft and model naming pass

#### Exit criteria

- We have a stable target model to build toward.
- Open architecture questions are reduced before schema implementation begins.

### Milestone 4: Core Schema and Data Access Rewrite

#### Goal

Implement the new schema foundation and start moving server code onto it.

#### Tasks

- Update `src/server/db/schema.ts` and `drizzle.config.ts` to the generalized model.
- Replace EID-specific user fields with generic equivalents.
- Introduce generalized org unit and position entities.
- Introduce generalized status/template models.
- Start rewriting affected server routers:
  - `src/server/api/routers/applications.ts`
  - `src/server/api/routers/systems.ts`
  - `src/server/api/routers/teams.ts`
  - `src/server/api/routers/availabilities.ts`
- Remove or isolate legacy assumptions as quickly as possible so we do not maintain two competing mental models for long.

#### Suggested PR slices

1. Schema foundation for orgs/units/positions
2. Template and status schema
3. Router updates for core CRUD and queries

#### Exit criteria

- The repo has a coherent generalized schema foundation.
- Core server code can query and mutate the new model.

### Milestone 5: RBAC and Admin Rebuild

#### Goal

Move access control and admin assignment onto the new scoped permission model.

#### Tasks

- Redesign `src/server/lib/rbac.ts` around capabilities and scopes.
- Update auth/session typing in `src/server/auth/config.ts`.
- Rebuild people/admin assignment flows in:
  - `src/app/people/actions.ts`
  - `src/app/people/page.tsx`
  - `src/app/people/_components/UserRoleTeamForm.tsx`
- Update route protection and navigation to use the same permission primitives.
- Add audit logging for role, permission, and config changes.

#### Suggested PR slices

1. Permission model and RBAC internals
2. Admin UI and assignment forms
3. Route guard and nav alignment

#### Exit criteria

- Permissions are no longer encoded mainly through `teamId` and `systemId`.
- Admin tooling works for generalized org structures.

### Milestone 6: Application Workflow Generalization

#### Goal

Rebuild submission and reviewer workflow around templates, configurable statuses, and generalized units/positions.

#### Tasks

- Rework application data flow in:
  - `src/app/application/[applicationId]/page.tsx`
  - `src/app/applications/page.tsx`
  - `src/app/applications/actions.tsx`
  - `src/app/applications/_components/*`
- Replace hardcoded stage/decision handling with configurable workflow logic.
- Add template version awareness to reading and writing submissions.
- Decide which reviewer workflow settings are deploy-time defaults vs admin-managed runtime data.

#### Suggested PR slices

1. Template-backed application reads/writes
2. Reviewer state/action rewrite
3. Admin workflow configuration UI or stubs

#### Exit criteria

- Positions can run custom forms and custom review pipelines without source edits.
- Reviewer tooling no longer depends on system-specific maps and enums.

### Milestone 7: Interview and Scheduling Rewrite

#### Goal

Generalize interview scheduling and communications around configurable interview modes.

#### Tasks

- Update:
  - `src/app/interview/page.tsx`
  - `src/app/interview/actions.ts`
  - `src/app/interview/_components/*`
  - `src/app/interviews/actions.ts`
  - `src/app/interviews/_components/*`
- Replace team-specific interview logic with configurable interview types.
- Rework availability ownership around the new org-unit or position model.
- Move remaining interview emails and reminders to generalized template/config layers.

#### Suggested PR slices

1. Interview type abstraction
2. Availability and scheduler rewrite
3. Interview communications cleanup

#### Exit criteria

- At least two interview modes work without code changes.
- Scheduling logic no longer assumes the current team/system structure.

### Milestone 8: Public Content, Optional Modules, and Validation

#### Goal

Finish the remaining white-label surface area and validate the generalized product against realistic org shapes.

#### Tasks

- Generalize applicant-facing templates under:
  - `src/app/application/[applicationId]/_components/interview.tsx`
  - `src/app/application/[applicationId]/_components/rejected.tsx`
  - `src/app/application/[applicationId]/_components/waitlist.tsx`
- Revisit `src/app/admin/blacklist/*` and decide whether it becomes a generic restriction system or is removed.
- Isolate advanced modules behind flags:
  - rubrics
  - ELO/pairwise ranking
  - webhooks/integrations
- Create and validate fixture organizations.
- Run smoke tests across the fixture orgs.

#### Suggested PR slices

1. Applicant communications cleanup
2. Restriction/blacklist redesign
3. Feature-flag cleanup for optional modules
4. Fixture-org test coverage

#### Exit criteria

- Remaining applicant/public content is generalized.
- The product works for the planned fixture organizations from a clean setup.

### Recommended dependency order

Use this order unless a narrow task can be safely pulled forward:

1. Milestone 1
2. Milestone 2
3. Milestone 3
4. Milestone 4
5. Milestone 5
6. Milestone 6
7. Milestone 7
8. Milestone 8

### Good first PRs

If we want fast momentum, the cleanest first slices are:

1. `src/config.ts` contract plus `src/app/layout.tsx` metadata cleanup
2. Landing/public page copy cleanup
3. Shared org-email policy abstraction
4. Email sender identity and template URL cleanup
5. Schema decision write-up before the actual database rewrite

## 12.1 Agent-Ready Issue Checklists

These checklists are written so each issue can be handed directly to an implementation agent. Each item should be treated as a bounded slice with a clear file surface and explicit completion criteria.

### Milestone 1 Issues

#### Issue 1.1: Define deploy-time config contract

- Status: `in_progress`

- Scope:
  - finalize the `src/config.ts` shape for branding, terminology, support links, feature flags, and metadata defaults
  - document what belongs in config versus database versus env
- Files:
  - `src/config.ts`
  - `docs-conversion-to-whitelabel/initial-plan.md`
  - `docs-conversion-to-whitelabel/implementation-plan.md`
- Tasks:
  - [x] define the normalized config object shape
  - [ ] add inline documentation for each config section
  - [x] identify any existing config gaps discovered in app shell/page code
  - [ ] document the ownership boundary for config vs runtime-managed data
- Done when:
  - [ ] the config contract is explicit and stable enough for downstream refactors

#### Issue 1.2: Refactor app metadata to config

- Status: `completed`

- Scope:
  - replace hardcoded metadata and app-shell branding with config-driven values
- Files:
  - `src/app/layout.tsx`
  - `src/config.ts`
- Tasks:
  - [x] move title, description, and icon references to config-backed values
  - [x] confirm layout metadata still renders correctly in Next 16
  - [x] remove remaining hardcoded org strings from app-shell metadata
- Done when:
  - [x] `src/app/layout.tsx` contains no Longhorn Racing or UT Austin metadata literals

#### Issue 1.3: Clean public and dashboard copy

- Status: `completed`

- Scope:
  - replace hardcoded organization copy on top-level pages with config-driven or placeholder runtime content
- Files:
  - `src/app/page.tsx`
  - `src/app/people/page.tsx`
  - `src/app/application/page.tsx`
  - `src/app/teams/page.tsx`
  - `src/app/teams/public/page.tsx`
  - `src/config.ts`
- Tasks:
  - [x] inventory hardcoded org references on each page
  - [x] replace static org names and descriptions with generalized content
  - [x] preserve page UX while removing org-specific assumptions
- Done when:
  - [x] top-level pages no longer mention the current organization by name unless sourced from config

#### Issue 1.4: Document brand asset override strategy

- Status: `not_started`

- Scope:
  - define how favicons, social images, and `.well-known` assets are supplied per deployment
- Files:
  - `public/favicon.ico`
  - `public/.well-known/microsoft-identity-association.json`
  - `docs-conversion-to-whitelabel/implementation-plan.md`
- Tasks:
  - [ ] audit current public assets for org-specific coupling
  - [ ] define the replacement mechanism for deploy-specific assets
  - [ ] document which assets are defaults versus required overrides
- Done when:
  - [ ] the deployment story for public assets is documented and unambiguous

### Milestone 2 Issues

#### Issue 2.1: Create shared org-email policy layer

- Status: `in_progress`

- Scope:
  - move email verification and allowed-domain logic into a shared policy abstraction
- Files:
  - `src/env.js`
  - `src/server/auth/config.ts`
  - `src/app/profile/actions.ts`
- Tasks:
  - [x] define policy inputs for the current required, domain-restricted flow
  - [x] remove domain validation from scattered action-level logic
  - [ ] document where policy values come from
- Done when:
  - [ ] auth/profile flows read from one shared org-email policy source

#### Issue 2.2: Generalize profile and sign-in UX

- Status: `in_progress`

- Scope:
  - update user-facing auth and verification messaging so it is organization-agnostic
- Files:
  - `src/app/profile/_components/ProfileForm.tsx`
  - `src/app/_components/sign-in-dialog.tsx`
  - `src/app/_components/header-client.tsx`
  - `src/app/verify/[token]/page.tsx`
  - `src/app/application/[applicationId]/page.tsx`
- Tasks:
  - [x] replace EID-specific copy with generalized org-email wording
  - [x] ensure validation and banner/error states match the shared policy layer
  - [ ] remove hardcoded school/domain assumptions from applicant submission gating
- Done when:
  - [ ] UI and validation flows no longer reference EID-specific concepts

#### Issue 2.3: Generalize transactional email identity

- Status: `in_progress`

- Scope:
  - remove hardcoded sender names, addresses, and org URLs from transactional email paths
- Files:
  - `src/app/api/update/route.ts`
  - `src/app/api/update/template.tsx`
  - `src/app/interview/actions.ts`
  - `src/config.ts`
  - `src/env.js`
- Tasks:
  - [x] define initial sender identity defaults in config
  - [~] replace hardcoded from/reply-to values
  - [~] replace hardcoded app URLs and org names in email text/templates
- Done when:
  - [ ] all transactional email paths use generalized sender and URL sources

#### Issue 2.4: Audit auth provider and verification dependencies

- Status: `not_started`

- Scope:
  - confirm current auth/env assumptions and identify what must become configurable
- Files:
  - `src/env.js`
  - `src/server/auth/config.ts`
- Tasks:
  - [ ] inventory current provider-specific env vars and assumptions
  - [ ] document which auth/provider options are fixed for now versus planned for generalization
  - [ ] call out any blockers for multiple verification policies
- Done when:
  - [ ] auth/env constraints are documented well enough to support the next schema phase

### Milestone 3 Issues

#### Issue 3.1: Finalize core entity model

- Scope:
  - settle the target names and relationships for organization hierarchy and positions
- Files:
  - `docs-conversion-to-whitelabel/implementation-plan.md`
  - `docs-conversion-to-whitelabel/initial-plan.md`
- Tasks:
  - [ ] decide the canonical replacements for `Team` and `System`
  - [ ] define the parent/child organization-unit model
  - [ ] decide whether `PositionCycle` exists as a first-class concept
- Done when:
  - [ ] the target hierarchy model is stable enough to implement in schema code

#### Issue 3.2: Decide tenancy and scoping model

- Scope:
  - determine whether to add `organizationId` now and document tenant boundaries
- Files:
  - `docs-conversion-to-whitelabel/implementation-plan.md`
  - `src/server/db/schema.ts`
- Tasks:
  - [ ] decide single-tenant-per-deploy vs future multi-tenant path
  - [ ] document query, cache, and asset scoping implications
  - [ ] record the final recommendation in the docs
- Done when:
  - [ ] data-scoping assumptions are explicit before schema changes begin

#### Issue 3.3: Define workflow model primitives

- Scope:
  - specify the new models for templates, statuses, transitions, and rubrics
- Files:
  - `docs-conversion-to-whitelabel/implementation-plan.md`
  - `src/server/db/schema.ts`
- Tasks:
  - [ ] define application template and template version concepts
  - [ ] define status and transition models
  - [ ] define rubric ownership and linkage points
  - [ ] decide whether statuses live at position, cycle, or template scope
- Done when:
  - [ ] downstream schema work has concrete workflow primitives to implement

### Milestone 4 Issues

#### Issue 4.1: Replace user and restriction primitives

- Scope:
  - remove EID-specific schema concepts and introduce generalized identity/restriction fields
- Files:
  - `src/server/db/schema.ts`
- Tasks:
  - [ ] replace `eidEmail` and `eidEmailVerified` with generic equivalents
  - [ ] replace `blacklistedEids` with a generalized restriction concept or placeholder
  - [ ] update schema comments to reflect the new model
- Done when:
  - [ ] schema no longer encodes UT/EID-specific user identity concepts

#### Issue 4.2: Implement organization-unit and position schema

- Scope:
  - introduce the generalized org hierarchy and position entities
- Files:
  - `src/server/db/schema.ts`
  - `drizzle.config.ts`
- Tasks:
  - [ ] add the organization-unit model and relationships
  - [ ] add position and optional cycle structures
  - [ ] remove or isolate rigid `Team -> System` coupling
- Done when:
  - [ ] the database model can represent non-Longhorn organization structures

#### Issue 4.3: Implement template, status, and rubric schema

- Scope:
  - create the workflow models needed for configurable applications and reviews
- Files:
  - `src/server/db/schema.ts`
- Tasks:
  - [ ] add application template and version tables
  - [ ] add configurable status and transition tables
  - [ ] add rubric definition tables or placeholders
- Done when:
  - [ ] workflow configuration is represented as data instead of fixed enums alone

#### Issue 4.4: Rewrite core routers onto the new model

- Scope:
  - migrate server data access to use the generalized schema
- Files:
  - `src/server/api/routers/applications.ts`
  - `src/server/api/routers/systems.ts`
  - `src/server/api/routers/teams.ts`
  - `src/server/api/routers/availabilities.ts`
- Tasks:
  - [ ] update queries and mutations to the new entity model
  - [ ] remove direct reliance on legacy `teamId` / `systemId` assumptions where the new model exists
  - [ ] preserve existing behavior enough for follow-on UI refactors
- Done when:
  - [ ] core router paths speak the new schema model coherently

### Milestone 5 Issues

#### Issue 5.1: Redesign RBAC primitives

- Scope:
  - rebuild access control around generalized capabilities and scopes
- Files:
  - `src/server/lib/rbac.ts`
  - `src/server/auth/config.ts`
- Tasks:
  - [ ] define capability names and scope types
  - [ ] remove direct permission inference based only on `teamId` / `systemId`
  - [ ] update session typing to match the new permission model
- Done when:
  - [ ] RBAC decisions can be expressed without the legacy hierarchy assumptions

#### Issue 5.2: Rebuild admin assignment flows

- Scope:
  - update admin/user assignment screens to work against generalized units and scopes
- Files:
  - `src/app/people/actions.ts`
  - `src/app/people/page.tsx`
  - `src/app/people/_components/UserRoleTeamForm.tsx`
- Tasks:
  - [ ] redesign form inputs away from team/system-only assignments
  - [ ] update actions to write generalized assignments
  - [ ] preserve a usable admin workflow during the transition
- Done when:
  - [ ] admins can assign users without relying on the old team/system mental model

#### Issue 5.3: Align route guards and navigation

- Scope:
  - ensure middleware, nav, and route access use the same permission source
- Files:
  - `src/server/auth/config.ts`
  - route protection helpers
  - navigation helpers/components
- Tasks:
  - [ ] inventory current route-protection logic
  - [ ] unify checks around the new permission primitives
  - [ ] remove duplicated access logic where possible
- Done when:
  - [ ] route access and visible navigation are driven by one coherent permission model

#### Issue 5.4: Add audit logging foundations

- Scope:
  - add the audit trail needed for permission and config administration
- Files:
  - schema and admin action paths touched during RBAC work
- Tasks:
  - [ ] define audit event categories
  - [ ] add logging hooks for role, permission, and config changes
  - [ ] document what events are required versus optional
- Done when:
  - [ ] the admin system has a clear audit foundation for sensitive changes

### Milestone 6 Issues

#### Issue 6.1: Move application reads and writes to templates

- Scope:
  - back application submission and display with template-aware models
- Files:
  - `src/app/application/[applicationId]/page.tsx`
  - `src/server/api/routers/applications.ts`
  - form-related schema
- Tasks:
  - [ ] update submission/read logic to resolve templates by position or cycle
  - [ ] support template version awareness for existing records
  - [ ] remove assumptions that one fixed form shape fits all positions
- Done when:
  - [ ] application data flow is template-aware end to end

#### Issue 6.2: Generalize reviewer actions and states

- Scope:
  - replace hardcoded status/decision handling in reviewer tooling
- Files:
  - `src/app/applications/page.tsx`
  - `src/app/applications/actions.tsx`
  - `src/app/applications/_components/*`
- Tasks:
  - [ ] replace enum/system-map assumptions with configurable workflow state
  - [ ] generalize filters, highlights, and reviewer actions
  - [ ] preserve core reviewer UX while changing the underlying model
- Done when:
  - [ ] reviewer screens operate on configurable workflow states

#### Issue 6.3: Define admin workflow configuration surface

- Scope:
  - establish how admins will manage forms, statuses, and review settings
- Files:
  - docs plus any initial admin UI stubs introduced for workflow config
- Tasks:
  - [ ] define the minimum admin-managed workflow settings
  - [ ] create UI stubs or documented placeholders if full UI is deferred
  - [ ] separate deploy-time defaults from runtime workflow configuration
- Done when:
  - [ ] there is a clear path for admins to manage workflow configuration

### Milestone 7 Issues

#### Issue 7.1: Introduce interview type abstraction

- Scope:
  - replace team-specific interview logic with configurable interview modes
- Files:
  - `src/app/interview/page.tsx`
  - `src/app/interview/actions.ts`
  - `src/server/db/schema.ts`
- Tasks:
  - [ ] define supported interview types
  - [ ] map interview behavior to configuration rather than team-specific branching
  - [ ] document status and permission interactions
- Done when:
  - [ ] interview behavior is driven by a generalized interview type model

#### Issue 7.2: Rewrite availability and scheduler ownership

- Scope:
  - move scheduling ownership from `systemId` toward the new org-unit or position model
- Files:
  - `src/app/interview/_components/*`
  - `src/app/interviews/actions.ts`
  - `src/app/interviews/_components/*`
  - `src/server/api/routers/availabilities.ts`
- Tasks:
  - [ ] update scheduler inputs and state to the new ownership model
  - [ ] update availability CRUD and query logic
  - [ ] keep one working scheduling path while broadening support
- Done when:
  - [ ] interview scheduling no longer depends on the legacy system assignment model

#### Issue 7.3: Generalize interview communications

- Scope:
  - move interview reminders and invites onto generalized communication templates
- Files:
  - `src/app/interview/actions.ts`
  - interview-related template/config files
- Tasks:
  - [ ] remove team-specific names and copy from interview emails
  - [ ] connect email content to generalized sender/config sources
  - [ ] verify at least two interview modes still send coherent messaging
- Done when:
  - [ ] interview communications are reusable across organization types

### Milestone 8 Issues

#### Issue 8.1: Generalize applicant-facing communication components

- Status: `completed`

- Scope:
  - remove org-specific copy from applicant-facing status/update components
- Files:
  - `src/app/application/[applicationId]/_components/interview.tsx`
  - `src/app/application/[applicationId]/_components/rejected.tsx`
  - `src/app/application/[applicationId]/_components/waitlist.tsx`
- Tasks:
  - [x] replace team-specific acceptance, rejection, and waitlist content
  - [x] connect component copy to generalized message sources
  - [x] preserve readable applicant communication states
- Done when:
  - [x] applicant communication components are organization-agnostic

#### Issue 8.2: Redesign or remove blacklist functionality

- Scope:
  - decide whether the current blacklist becomes a generic restriction system
- Files:
  - `src/app/admin/blacklist/*`
  - `src/server/db/schema.ts`
- Tasks:
  - [ ] decide the product intent for restrictions or blocked applicants
  - [ ] rename or redesign the feature if it remains
  - [ ] remove EID-specific admin language if retained
- Done when:
  - [ ] restriction functionality matches the generalized product model

#### Issue 8.3: Isolate optional modules behind flags

- Scope:
  - ensure advanced features can be enabled per organization without leaking assumptions into core flows
- Files:
  - optional module entry points for rubrics, ranking, and integrations
  - `src/config.ts`
- Tasks:
  - [ ] identify every optional module surface
  - [ ] gate advanced modules behind config or runtime feature settings
  - [ ] remove accidental coupling between optional features and core flows
- Done when:
  - [ ] advanced modules are optional and isolated

#### Issue 8.4: Create fixture orgs and smoke-test matrix

- Scope:
  - validate the generalized product against multiple organization shapes
- Files:
  - fixture/test setup files introduced for validation
  - docs if needed for fixture definitions
- Tasks:
  - [ ] create the three planned fixture organization shapes
  - [ ] define smoke-test coverage for each fixture
  - [ ] record any remaining hardcoded assumptions discovered during validation
- Done when:
  - [ ] the product passes core-flow validation for the fixture organizations

## 13. Definition of Done

This project is done when:

- no top-level product flow contains organization-specific hardcoded copy, domains, or sender identity
- auth, verification, and permissions are driven by generalized policy and configuration
- the schema can represent multiple organization shapes without code edits
- forms, statuses, and reviewer workflows are configurable
- public assets and metadata are replaceable per deployment
- at least the three fixture organizations can run core flows successfully from a clean setup
