# Italian Builders

A dark, terminal/technical-themed showcase + waitlist homepage for a curated directory of 500+ Italian technical founders, makers, and open-source contributors.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/italian-builders/` — the public homepage (React + Vite, previewPath `/`). Single-page UI lives in `src/pages/Home.tsx`; theme in `src/index.css`.
- `artifacts/api-server/src/routes/` — Express routes: `waitlist.ts` (signup + count), `directory.ts` (builders/projects/os-projects/stats).
- `lib/api-spec/openapi.yaml` — source of truth for the API contract. Run codegen after editing.
- `lib/db/src/schema/` — Drizzle tables: `waitlist.ts`, `builders.ts`, `projects.ts`, `osProjects.ts`.
- `artifacts/italian-builders/public/images/` — generated builder avatars (`avatar-1..10.png`) and project previews (`project-1..9.png`), served at `/images/...`.
- `artifacts/mockup-sandbox/src/components/mockups/italian-builders/` — the original approved canvas mockup (design source of truth).

## Architecture decisions

- Contract-first: the OpenAPI spec drives generated React Query hooks (`@workspace/api-client-react`) and Zod validators (`@workspace/api-zod`). Routes validate inputs/outputs with the generated Zod schemas.
- Directory content (builders, projects, OS projects) is DB-backed and seeded; `/stats` returns static display strings ("500+"/"20"/"60+").
- Image URLs are stored as absolute paths (`/images/...`) in the DB so they resolve identically in dev and prod (artifact base path is `/`).
- Duplicate waitlist emails: the unique constraint on `waitlist_signups.email` raises Postgres `23505`, which Drizzle wraps — the route checks both `err.code` and `err.cause.code` and returns `409`.
- The hero globe uses `cobe` (WebGL); markers are built by looking up each builder's `location` in a static `CITY_COORDS` map.

## Product

- A single scrolling homepage: hero with an interactive Italy globe + cycling builder HUD + live stats, featured builders carousel, filterable builder projects, community OS projects, and a functional "Network Access Protocol" waitlist form.
- The waitlist form persists signups to Postgres, shows a confirmation state, surfaces server errors (e.g. already-registered email), and the live waitlist count updates after signup.

## User preferences

- No emojis in the UI — use `lucide-react` icons only.

## Gotchas

- After editing `lib/db/src/schema/`, run `pnpm run typecheck:libs` before typechecking artifacts/api-server — stale lib declarations show up as "no exported member" errors.
- After editing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` to regenerate hooks and Zod schemas.
- WebGL canvas (the globe) often renders black in static screenshots — verify it live in the browser, not via screenshot.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
