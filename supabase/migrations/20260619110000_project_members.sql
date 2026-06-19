create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text,
  contribution_note text,
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, profile_id)
);

create index if not exists project_members_project_idx
on public.project_members (project_id);

create index if not exists project_members_profile_idx
on public.project_members (profile_id);

create or replace function private.is_project_owner(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select exists (
    select 1
    from public.projects
    where id = project_uuid
      and owner_id = auth.uid()
  );
$$;

create or replace function private.is_project_member(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select exists (
    select 1
    from public.project_members
    where project_id = project_uuid
      and profile_id = auth.uid()
  );
$$;

create or replace function private.is_public_project(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select exists (
    select 1
    from public.projects
    join public.profiles on profiles.id = projects.owner_id
    where projects.id = project_uuid
      and projects.is_public = true
      and profiles.visibility = 'public'
  );
$$;

create or replace function private.is_community_project_member(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select exists (
    select 1
    from public.community_project_members
    where community_project_id = project_uuid
      and profile_id = auth.uid()
  );
$$;

create or replace function private.is_public_community_project(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select exists (
    select 1
    from public.community_projects
    where id = project_uuid
      and is_public = true
  );
$$;

create or replace function public.protect_project_member_update()
returns trigger
language plpgsql
set search_path = public, private, pg_temp
as $$
begin
  if not private.is_platform_admin() and not private.is_project_owner(old.project_id) then
    if new.project_id is distinct from old.project_id
      or new.profile_id is distinct from old.profile_id
      or new.invited_by is distinct from old.invited_by then
      raise exception 'Contributors can only update their role and contribution note.';
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists project_members_protect_update on public.project_members;
create trigger project_members_protect_update
before update on public.project_members
for each row execute function public.protect_project_member_update();

alter table public.project_members enable row level security;

create policy "Project members are readable"
on public.project_members for select
using (
  profile_id = auth.uid()
  or private.is_platform_admin()
  or private.is_project_owner(project_id)
  or private.is_public_project(project_id)
);

create policy "Project owners can invite members"
on public.project_members for insert
with check (
  private.is_platform_admin()
  or (
    private.is_project_owner(project_id)
    and (invited_by is null or invited_by = auth.uid())
  )
);

create policy "Project owners can update members"
on public.project_members for update
using (private.is_platform_admin() or private.is_project_owner(project_id))
with check (private.is_platform_admin() or private.is_project_owner(project_id));

create policy "Contributors can update their own project role"
on public.project_members for update
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "Project owners can remove members"
on public.project_members for delete
using (private.is_platform_admin() or private.is_project_owner(project_id));

create policy "Project contributors can read assigned projects"
on public.projects for select
using (private.is_project_member(id));

alter table public.community_project_members
add column if not exists updated_at timestamptz not null default now();

create or replace function public.protect_community_project_member_update()
returns trigger
language plpgsql
set search_path = public, private, pg_temp
as $$
begin
  if not private.is_platform_admin() then
    if new.community_project_id is distinct from old.community_project_id
      or new.profile_id is distinct from old.profile_id
      or new.assigned_by is distinct from old.assigned_by then
      raise exception 'Contributors can only update their role and contribution note.';
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists community_project_members_protect_update on public.community_project_members;
create trigger community_project_members_protect_update
before update on public.community_project_members
for each row execute function public.protect_community_project_member_update();

drop policy if exists "Community project members are readable" on public.community_project_members;
create policy "Community project members are readable"
on public.community_project_members for select
using (
  profile_id = auth.uid()
  or private.is_platform_admin()
  or private.is_public_community_project(community_project_id)
);

create policy "Contributors can update their own community project role"
on public.community_project_members for update
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "Assigned members can read community projects"
on public.community_projects for select
using (private.is_community_project_member(id));

grant select, insert, update, delete on public.project_members to authenticated;
grant select on public.project_members to anon;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_project_owner(uuid) to authenticated;
grant execute on function private.is_project_member(uuid) to authenticated;
grant execute on function private.is_public_project(uuid) to anon, authenticated;
grant execute on function private.is_community_project_member(uuid) to authenticated;
grant execute on function private.is_public_community_project(uuid) to anon, authenticated;
