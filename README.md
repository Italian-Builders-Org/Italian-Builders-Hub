# Italian Builders Hub

Italian Builders Hub is the community platform for Italian founders, builders,
developers, designers, and operators who want to discover each other, share
projects, and coordinate open-source work.

The app combines a public website with an invite-only member platform:

- public pages for the community mission, builders, projects, open-source work,
  privacy, and terms
- Supabase-backed authentication, profiles, member visibility, and projects
- admin flows for waitlist review, invite creation, member management, and
  community project assignment
- Cloudflare R2 media uploads through short-lived signed upload URLs
- Vercel serverless API routes for waitlist, consent, media, profile pages, and
  social images

## Repository Status

This repository is intended to live under the `Italian-Builders-Org` GitHub
organization so that organization members can collaborate on the project. The
application packages remain marked `private: true` because they are deployed as
apps, not published to npm.

## Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, Radix UI, Wouter
- **Data/auth:** Supabase Auth, Postgres, Row Level Security
- **Media:** Cloudflare R2 signed uploads
- **API:** Vercel serverless functions plus shared TypeScript libraries
- **Monitoring:** optional Sentry browser reporting and sourcemap uploads
- **Package manager:** pnpm workspaces

## Workspace Layout

```text
.
├── api/                         # Vercel serverless route entrypoints
├── artifacts/
│   ├── italian-builders/        # Main React/Vite web application
│   ├── api-server/              # API server artifact
│   └── mockup-sandbox/          # Design/mockup artifact
├── lib/
│   ├── api-client-react/        # Generated React API client helpers
│   ├── api-spec/                # OpenAPI spec and generation config
│   ├── api-zod/                 # Shared API validation types
│   └── db/                      # Database schema helpers
├── server/api/                  # Shared server-side API implementations
├── supabase/migrations/         # Supabase/Postgres migrations
├── docs/                        # Project notes, audits, and supporting docs
├── scripts/                     # Operational scripts
└── vercel.json                  # Production build and routing config
```

## Prerequisites

- Node.js compatible with the workspace lockfile
- pnpm
- Supabase project credentials for database/auth-backed development
- Cloudflare R2 credentials if you need to test media uploads
- Vercel credentials if you need to deploy or update production settings

The workspace enforces pnpm in `preinstall`; do not use npm or yarn for
dependency installation.

## Local Setup

Install dependencies from the repository root:

```bash
pnpm install
```

Create local environment values:

```bash
cp .env.example .env.local
```

Fill the required values in `.env.local`. At minimum, the web app needs:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_R2_PUBLIC_BASE_URL
```

Database migrations and server-side admin flows also need server-only values
such as `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and the relevant R2,
Turnstile, Resend, Sentry, or Vercel credentials for the feature being tested.
Never commit real `.env` files.

Run the main web app locally:

```bash
PORT=5173 pnpm --filter @workspace/italian-builders run dev
```

Open `http://localhost:5173`.

## Quality Checks

Run type checks for the full workspace:

```bash
pnpm run typecheck
```

Build everything that has a build script:

```bash
pnpm run build
```

Build only the web app:

```bash
pnpm --filter @workspace/italian-builders run build
```

## Supabase

The database schema is managed through SQL migrations in
`supabase/migrations/`. The initial community platform schema creates profiles,
invites, projects, community projects, waitlist signups, admin emails, and the
supporting Row Level Security policies.

Profile creation is invite-only. A signed-in user accepts an invite through
`/invite/:token`; the `accept_invite()` database function validates the token
and creates the approved profile.

For local or production migration work, use a pooled Supabase Postgres URL when
direct database hosts are unavailable:

```text
postgresql://postgres.<project-ref>:<password>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require&uselibpqcompat=true
```

## Media Uploads

User-uploaded profile, cover, project, and community project images are stored
in Cloudflare R2. The browser requests a short-lived signed upload URL from the
server, uploads directly to R2, and stores the resulting public asset URL in
Supabase.

Required server-only values include:

```text
R2_ACCOUNT_ID
R2_BUCKET_NAME
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_ENDPOINT
R2_PUBLIC_BASE_URL
```

The browser-safe public asset base URL is exposed through:

```text
VITE_R2_PUBLIC_BASE_URL
```

## Deployment

Vercel deployment is configured in `vercel.json`:

```text
installCommand: pnpm install --frozen-lockfile
buildCommand: pnpm --filter @workspace/italian-builders run build
outputDirectory: artifacts/italian-builders/dist/public
```

API routes under `api/` are deployed as Vercel serverless functions. The final
rewrite sends non-API routes to the React app entrypoint.

Production deployments need the same environment variables described in
`.env.example`, configured in Vercel for the appropriate environments.

## Contributing

1. Create a branch from `main`.
2. Keep changes focused and avoid unrelated cleanup in the same branch.
3. Add or update tests when behavior changes.
4. Run `pnpm run typecheck` and the relevant build before opening a pull
   request.
5. Do not commit local environment files, Vercel project metadata, Supabase
   local cache files, generated build output, or credentials.

When adding dependencies, update the relevant `package.json` and run
`pnpm install` from the workspace root before committing.

## Security

This project uses browser-safe public keys only for `VITE_*` variables. Secrets
such as Supabase service role keys, R2 access keys, Resend keys, Sentry auth
tokens, and Vercel tokens must stay server-side and must never be committed.

Security notes and prior audit context live in `docs/`.

## License

The workspace package metadata declares the project as MIT licensed.
