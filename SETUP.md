# Italian Builders Hub Setup

## Environment

Copy `.env.example` to `.env.local` and fill the values.

Required for the Vite app:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_R2_PUBLIC_BASE_URL`

Required for database migrations:

- `DATABASE_URL`

For this Supabase project, the direct host did not resolve locally, while the pooler worked. Use the pooler format:

```text
postgresql://postgres.<project-ref>:<password>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require
```

Required for media uploads through Cloudflare R2:

- `R2_ACCOUNT_ID`
- `R2_BUCKET_NAME`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_ENDPOINT`
- `R2_PUBLIC_BASE_URL`
- `VITE_R2_PUBLIC_BASE_URL`

The production media path uses Cloudflare R2 through short-lived signed upload URLs. Profile images, cover images, personal project images, and community project images are uploaded by authenticated users to a folder scoped by their Supabase user id. Supabase remains the source of truth for Auth and Postgres rows; R2 stores only the media objects and the database stores their public URLs.

## Supabase Schema

The MVP schema is in:

```text
supabase/migrations/20260619004110_community_mvp_schema.sql
```

It creates:

- `profiles`
- `invites`
- `projects`
- `community_projects`
- `community_project_members`
- `waitlist_signups`
- `admin_emails`
- Cloudflare R2 bucket for uploaded media

RLS is enabled on all tables. Public users can read public profiles and public projects. Members can manage their own profile and personal projects. Admins and owners can manage invites, members, community projects, and assignments.

Profile creation is invite-only. Ordinary authenticated users cannot insert directly into `profiles`; the `accept_invite()` function creates the approved profile after a valid invite token is accepted.

## First Owner

After the first user signs in and creates a profile, promote that profile from Supabase SQL editor or `psql`:

```sql
update public.profiles
set platform_role = 'owner'
where email = 'you@example.com';
```

After that, the owner can use:

```text
/admin
/admin/invites
/admin/members
/admin/community-projects
```

## Invite Flow

1. Admin opens `/admin/invites`.
2. Admin creates an invite with an email and/or Telegram handle.
3. Admin copies the invite link.
4. User opens `/invite/<token>`.
5. User signs in or creates a Supabase Auth account.
6. User completes onboarding.
7. The database marks the invite as accepted and creates/updates the profile.

If Supabase email confirmation is enabled, add these redirect URLs in Supabase Auth settings:

```text
http://localhost:5173/**
https://italian-builders.vercel.app/**
https://your-production-domain.com/**
```

## Local Commands

```bash
pnpm install
pnpm --filter @workspace/italian-builders run typecheck
pnpm --filter @workspace/italian-builders run build
pnpm --filter @workspace/italian-builders run dev
```

## Vercel

The Vercel deployment is configured by `vercel.json`:

```text
installCommand: pnpm install --frozen-lockfile
buildCommand: pnpm --filter @workspace/italian-builders run build
outputDirectory: artifacts/italian-builders/dist/public
```
