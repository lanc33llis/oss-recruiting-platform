# AGENTS.md

This repository should be implemented with a server-first Next.js App Router mindset.

## Default Architecture

- Prefer React Server Components first.
- Prefer Server Actions for writes and simple server-side mutations tied to UI flows.
- Prefer `Suspense` boundaries around async UI work so routes do not block on slow data.
- Prefer streaming server-rendered UI over moving data fetching into client components.
- Prefer `tRPC` second, when the interaction genuinely benefits from client-side caching, client-driven refetching, or imperative client mutations across multiple screens.

## Decision Order

When adding new functionality, use this order by default:

1. Server Component
2. `Suspense` boundary
3. Server Action
4. `tRPC`

If a feature can be built cleanly without a client component, keep it on the server.

## Practical Standards

- Keep data fetching in the route or server component whenever possible.
- Add client components only for real browser interactivity, local state, or browser-only APIs.
- Do not introduce REST endpoints for app-internal flows unless there is a clear external integration need.
- Keep loading states explicit with `Suspense` and route-level `loading.tsx` where appropriate.
- Keep mutations close to the UI that owns them; Server Actions are the default for forms and button-driven mutations.
- Use `tRPC` for shared client cache workflows, rich client dashboards, or cases where multiple client components need coordinated query state.

## White-Label Work

- Keep deploy-time branding and default content in `src/config.ts`.
- Avoid hardcoding organization names, domains, sender identity, or metadata in page/component files.
- Prefer generalized terminology and config-backed copy, even when current defaults remain branded.
