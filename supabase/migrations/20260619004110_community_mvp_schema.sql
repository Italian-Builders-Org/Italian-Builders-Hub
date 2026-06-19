create extension if not exists pgcrypto;

create schema if not exists private;

create type public.profile_visibility as enum ('public', 'unlisted', 'private');
create type public.platform_role as enum ('member', 'admin', 'owner');
create type public.invite_status as enum ('pending', 'accepted', 'expired', 'revoked');
create type public.project_status as enum ('idea', 'building', 'beta', 'live', 'revenue', 'paused');
create type public.community_project_status as enum ('proposed', 'active', 'paused', 'completed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  headline text,
  bio text,
  avatar_url text,
  cover_url text,
  location text,
  city text,
  country text not null default 'Italy',
  telegram_handle text,
  email text,
  email_public boolean not null default false,
  website_url text,
  linkedin_url text,
  x_url text,
  github_url text,
  youtube_url text,
  instagram_url text,
  role text,
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  looking_for text[] not null default '{}',
  languages text[] not null default '{}',
  intro_video_url text,
  visibility public.profile_visibility not null default 'public',
  platform_role public.platform_role not null default 'member',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9][a-z0-9_-]{2,31}$')
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  email text,
  telegram_handle text,
  token text unique not null,
  status public.invite_status not null default 'pending',
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint invites_contact_required check (
    nullif(trim(coalesce(email, '')), '') is not null
    or nullif(trim(coalesce(telegram_handle, '')), '') is not null
  )
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text unique not null,
  tagline text,
  description text,
  category text,
  status public.project_status not null default 'building',
  website_url text,
  github_url text,
  demo_url text,
  image_url text,
  is_open_source boolean not null default false,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{2,80}$')
);

create table public.community_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  tagline text,
  description text,
  category text,
  status public.community_project_status not null default 'proposed',
  repo_url text,
  website_url text,
  image_url text,
  is_public boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_projects_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{2,80}$')
);

create table public.community_project_members (
  id uuid primary key default gen_random_uuid(),
  community_project_id uuid not null references public.community_projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text,
  contribution_note text,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (community_project_id, profile_id)
);

create index profiles_visibility_idx on public.profiles (visibility);
create index profiles_platform_role_idx on public.profiles (platform_role);
create index invites_token_idx on public.invites (token);
create index invites_status_idx on public.invites (status);
create index projects_owner_id_idx on public.projects (owner_id);
create index projects_public_idx on public.projects (is_public, status, category);
create index community_projects_public_idx on public.community_projects (is_public, status, category);
create index community_project_members_project_idx on public.community_project_members (community_project_id);
create index community_project_members_profile_idx on public.community_project_members (profile_id);

create or replace function private.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and platform_role in ('admin', 'owner')
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.protect_profile_platform_role()
returns trigger
language plpgsql
set search_path = public, private, pg_temp
as $$
begin
  if tg_op = 'INSERT' and new.platform_role <> 'member' and not private.is_platform_admin() then
    raise exception 'Only platform admins can assign platform roles.';
  end if;

  if tg_op = 'UPDATE' and new.platform_role is distinct from old.platform_role and not private.is_platform_admin() then
    raise exception 'Only platform admins can change platform roles.';
  end if;

  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger projects_touch_updated_at
before update on public.projects
for each row execute function public.touch_updated_at();

create trigger community_projects_touch_updated_at
before update on public.community_projects
for each row execute function public.touch_updated_at();

create trigger profiles_protect_platform_role
before insert or update on public.profiles
for each row execute function public.protect_profile_platform_role();

alter table public.profiles enable row level security;
alter table public.invites enable row level security;
alter table public.projects enable row level security;
alter table public.community_projects enable row level security;
alter table public.community_project_members enable row level security;

create policy "Public profiles are readable"
on public.profiles for select
using (visibility = 'public' or id = auth.uid() or private.is_platform_admin());

create policy "Users can create their own profile"
on public.profiles for insert
with check (id = auth.uid());

create policy "Users can update their own profile"
on public.profiles for update
using (id = auth.uid() or private.is_platform_admin())
with check (id = auth.uid() or private.is_platform_admin());

create policy "Admins can delete profiles"
on public.profiles for delete
using (private.is_platform_admin());

create policy "Admins can manage invites"
on public.invites for all
using (private.is_platform_admin())
with check (private.is_platform_admin());

create policy "Public projects are readable"
on public.projects for select
using (
  owner_id = auth.uid()
  or private.is_platform_admin()
  or (
    is_public = true
    and exists (
      select 1
      from public.profiles
      where profiles.id = projects.owner_id
        and profiles.visibility = 'public'
    )
  )
);

create policy "Users can create their own projects"
on public.projects for insert
with check (owner_id = auth.uid() or private.is_platform_admin());

create policy "Users can update their own projects"
on public.projects for update
using (owner_id = auth.uid() or private.is_platform_admin())
with check (owner_id = auth.uid() or private.is_platform_admin());

create policy "Users can delete their own projects"
on public.projects for delete
using (owner_id = auth.uid() or private.is_platform_admin());

create policy "Public community projects are readable"
on public.community_projects for select
using (is_public = true or private.is_platform_admin());

create policy "Admins can manage community projects"
on public.community_projects for all
using (private.is_platform_admin())
with check (private.is_platform_admin());

create policy "Community project members are readable"
on public.community_project_members for select
using (
  profile_id = auth.uid()
  or private.is_platform_admin()
  or exists (
    select 1
    from public.community_projects
    where community_projects.id = community_project_members.community_project_id
      and community_projects.is_public = true
  )
);

create policy "Admins can manage community project members"
on public.community_project_members for all
using (private.is_platform_admin())
with check (private.is_platform_admin());

create or replace function public.get_invite_by_token(invite_token text)
returns table (
  id uuid,
  email text,
  telegram_handle text,
  status public.invite_status,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select i.id, i.email, i.telegram_handle, i.status, i.expires_at
  from public.invites i
  where i.token = invite_token
    and i.status = 'pending'
    and (i.expires_at is null or i.expires_at > now())
  limit 1;
$$;

create or replace function public.accept_invite(
  invite_token text,
  profile_username text,
  profile_full_name text,
  profile_headline text,
  profile_bio text,
  profile_telegram_handle text,
  profile_role text,
  profile_languages text[],
  profile_skills text[] default '{}',
  profile_looking_for text[] default '{}',
  profile_website_url text default null,
  profile_linkedin_url text default null,
  profile_x_url text default null,
  profile_github_url text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  current_profile public.profiles;
  invite_row public.invites;
  user_id uuid := auth.uid();
  user_email text := auth.email();
begin
  if user_id is null then
    raise exception 'You must be signed in to accept an invite.';
  end if;

  select *
  into invite_row
  from public.invites
  where token = invite_token
    and status = 'pending'
    and (expires_at is null or expires_at > now())
  for update;

  if invite_row.id is null then
    raise exception 'Invite is invalid, expired, or already used.';
  end if;

  insert into public.profiles (
    id,
    username,
    full_name,
    headline,
    bio,
    telegram_handle,
    email,
    role,
    languages,
    skills,
    looking_for,
    website_url,
    linkedin_url,
    x_url,
    github_url,
    onboarding_completed
  )
  values (
    user_id,
    lower(profile_username),
    profile_full_name,
    profile_headline,
    profile_bio,
    coalesce(nullif(profile_telegram_handle, ''), invite_row.telegram_handle),
    coalesce(user_email, invite_row.email),
    profile_role,
    coalesce(profile_languages, '{}'),
    coalesce(profile_skills, '{}'),
    coalesce(profile_looking_for, '{}'),
    profile_website_url,
    profile_linkedin_url,
    profile_x_url,
    profile_github_url,
    true
  )
  on conflict (id) do update set
    username = excluded.username,
    full_name = excluded.full_name,
    headline = excluded.headline,
    bio = excluded.bio,
    telegram_handle = excluded.telegram_handle,
    email = excluded.email,
    role = excluded.role,
    languages = excluded.languages,
    skills = excluded.skills,
    looking_for = excluded.looking_for,
    website_url = excluded.website_url,
    linkedin_url = excluded.linkedin_url,
    x_url = excluded.x_url,
    github_url = excluded.github_url,
    onboarding_completed = true,
    updated_at = now()
  returning *
  into current_profile;

  update public.invites
  set
    status = 'accepted',
    accepted_by = user_id,
    accepted_at = now()
  where id = invite_row.id;

  return current_profile;
end;
$$;

grant usage on schema public to anon, authenticated;
grant usage on schema private to authenticated;

grant select on public.profiles to anon, authenticated;
grant insert, update, delete on public.profiles to authenticated;

grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;

grant select on public.community_projects to anon, authenticated;
grant insert, update, delete on public.community_projects to authenticated;

grant select on public.community_project_members to anon, authenticated;
grant insert, update, delete on public.community_project_members to authenticated;

grant select, insert, update, delete on public.invites to authenticated;

grant execute on function public.get_invite_by_token(text) to anon, authenticated;
grant execute on function public.accept_invite(text, text, text, text, text, text, text, text[], text[], text[], text, text, text, text) to authenticated;
