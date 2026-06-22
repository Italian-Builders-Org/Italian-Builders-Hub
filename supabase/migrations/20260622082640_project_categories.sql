create table public.project_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text unique not null,
  group_name text not null default 'other',
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_categories_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,80}$'),
  constraint project_categories_group_valid check (
    group_name in ('type', 'technology', 'market', 'industry', 'stage', 'other')
  )
);

create table public.project_category_tags (
  project_id uuid not null references public.projects(id) on delete cascade,
  category_id uuid not null references public.project_categories(id) on delete restrict,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (project_id, category_id),
  constraint project_category_tags_position_valid check (position between 0 and 5),
  constraint project_category_tags_project_position_unique unique (project_id, position)
);

create index project_categories_active_sort_idx
on public.project_categories (is_active, group_name, sort_order, name);

create index project_category_tags_category_id_idx
on public.project_category_tags (category_id);

create trigger project_categories_touch_updated_at
before update on public.project_categories
for each row execute function public.touch_updated_at();

create or replace function public.enforce_project_category_tag_limit()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if (
      select count(*)
      from public.project_category_tags
      where project_id = new.project_id
    ) >= 6 then
      raise exception 'Projects can have at most 6 category tags';
    end if;
  else
    if (
      select count(*)
      from public.project_category_tags
      where project_id = new.project_id
        and category_id <> old.category_id
    ) >= 6 then
      raise exception 'Projects can have at most 6 category tags';
    end if;
  end if;

  return new;
end;
$$;

create trigger project_category_tags_limit
before insert or update on public.project_category_tags
for each row execute function public.enforce_project_category_tag_limit();

alter table public.project_categories enable row level security;
alter table public.project_category_tags enable row level security;

create policy "Project categories are readable"
on public.project_categories for select
using (is_active = true or private.is_platform_admin());

create policy "Admins can manage project categories"
on public.project_categories for all
using (private.is_platform_admin())
with check (private.is_platform_admin());

create policy "Public project category tags are readable"
on public.project_category_tags for select
using (
  exists (
    select 1
    from public.projects
    where projects.id = project_category_tags.project_id
      and (
        projects.is_public = true
        or projects.owner_id = auth.uid()
        or private.is_platform_admin()
        or exists (
          select 1
          from public.project_members
          where project_members.project_id = projects.id
            and project_members.profile_id = auth.uid()
        )
      )
  )
);

create policy "Project owners can manage category tags"
on public.project_category_tags for all
using (
  private.is_platform_admin()
  or exists (
    select 1
    from public.projects
    where projects.id = project_category_tags.project_id
      and projects.owner_id = auth.uid()
  )
)
with check (
  private.is_platform_admin()
  or exists (
    select 1
    from public.projects
    where projects.id = project_category_tags.project_id
      and projects.owner_id = auth.uid()
  )
);

insert into public.project_categories (slug, name, group_name, sort_order)
values
  ('startup', 'Startup', 'type', 10),
  ('saas', 'SaaS', 'type', 20),
  ('marketplace', 'Marketplace', 'type', 30),
  ('developer-tools', 'Developer Tools', 'type', 40),
  ('open-source', 'Open Source', 'type', 50),
  ('ai', 'AI', 'technology', 10),
  ('automation', 'Automation', 'technology', 20),
  ('no-code', 'No-Code', 'technology', 30),
  ('mobile', 'Mobile', 'technology', 40),
  ('hardware', 'Hardware', 'technology', 50),
  ('iot', 'IoT', 'technology', 60),
  ('crypto', 'Crypto', 'technology', 70),
  ('b2b', 'B2B', 'market', 10),
  ('b2c', 'B2C', 'market', 20),
  ('b2b2c', 'B2B2C', 'market', 30),
  ('consumer-apps', 'Consumer Apps', 'market', 40),
  ('fashion', 'Fashion', 'industry', 10),
  ('fintech', 'Fintech', 'industry', 20),
  ('e-commerce', 'E-commerce', 'industry', 30),
  ('healthcare', 'Healthcare', 'industry', 40),
  ('education', 'Education', 'industry', 50),
  ('travel', 'Travel', 'industry', 60),
  ('food', 'Food', 'industry', 70),
  ('media', 'Media', 'industry', 80),
  ('design', 'Design', 'industry', 90),
  ('productivity', 'Productivity', 'industry', 100)
on conflict (slug) do update
set
  name = excluded.name,
  group_name = excluded.group_name,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

insert into public.project_categories (slug, name, group_name, sort_order)
select distinct
  regexp_replace(lower(trim(projects.category)), '[^a-z0-9]+', '-', 'g'),
  trim(projects.category),
  'other',
  500
from public.projects
where nullif(trim(coalesce(projects.category, '')), '') is not null
on conflict (slug) do nothing;

insert into public.project_category_tags (project_id, category_id, position)
select projects.id, project_categories.id, 0
from public.projects
join public.project_categories
  on project_categories.slug = regexp_replace(lower(trim(projects.category)), '[^a-z0-9]+', '-', 'g')
where nullif(trim(coalesce(projects.category, '')), '') is not null
on conflict do nothing;

grant select on public.project_categories to anon, authenticated;
grant insert, update, delete on public.project_categories to authenticated;

grant select on public.project_category_tags to anon, authenticated;
grant insert, update, delete on public.project_category_tags to authenticated;
