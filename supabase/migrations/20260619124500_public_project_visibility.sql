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
    where id = project_uuid
      and is_public = true
  );
$$;

drop policy if exists "Public projects are readable" on public.projects;
create policy "Public projects are readable"
on public.projects for select
using (
  owner_id = auth.uid()
  or private.is_platform_admin()
  or is_public = true
);

grant execute on function private.is_public_project(uuid) to anon, authenticated;
