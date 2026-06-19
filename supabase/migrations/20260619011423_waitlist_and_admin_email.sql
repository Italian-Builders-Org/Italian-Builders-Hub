create table if not exists public.admin_emails (
  email text primary key,
  label text,
  created_at timestamptz not null default now(),
  constraint admin_emails_lowercase check (email = lower(email))
);

insert into public.admin_emails (email, label)
values ('domenico.dd@gmail.com', 'Domenico Di Donna')
on conflict (email) do update set label = excluded.label;

alter table public.admin_emails enable row level security;

drop policy if exists "Admins can read admin emails" on public.admin_emails;
create policy "Admins can read admin emails"
on public.admin_emails for select
using (private.is_platform_admin());

drop policy if exists "Admins can manage admin emails" on public.admin_emails;
create policy "Admins can manage admin emails"
on public.admin_emails for all
using (private.is_platform_admin())
with check (private.is_platform_admin());

create or replace function public.protect_profile_platform_role()
returns trigger
language plpgsql
set search_path = public, private, pg_temp
as $$
begin
  if new.email is not null and exists (
    select 1 from public.admin_emails where email = lower(new.email)
  ) then
    if coalesce(new.platform_role, 'member') = 'member' then
      new.platform_role = 'admin';
    end if;
  end if;

  if tg_op = 'INSERT' and new.platform_role <> 'member' and not private.is_platform_admin() then
    if not exists (select 1 from public.admin_emails where email = lower(coalesce(new.email, ''))) then
      raise exception 'Only platform admins can assign platform roles.';
    end if;
  end if;

  if tg_op = 'UPDATE' and new.platform_role is distinct from old.platform_role and not private.is_platform_admin() then
    if not exists (select 1 from public.admin_emails where email = lower(coalesce(new.email, ''))) then
      raise exception 'Only platform admins can change platform roles.';
    end if;
  end if;

  return new;
end;
$$;

update public.profiles
set platform_role = 'admin'
where lower(email) = 'domenico.dd@gmail.com'
  and platform_role = 'member';

create table if not exists public.waitlist_signups (
  id bigserial primary key,
  name text not null,
  email text not null unique,
  role text not null,
  building text,
  x_handle text,
  linkedin text,
  website text,
  project_url text,
  created_at timestamptz not null default now()
);

alter table public.waitlist_signups enable row level security;

drop policy if exists "Anyone can join the waitlist" on public.waitlist_signups;
create policy "Anyone can join the waitlist"
on public.waitlist_signups for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read waitlist" on public.waitlist_signups;
create policy "Admins can read waitlist"
on public.waitlist_signups for select
to authenticated
using (private.is_platform_admin());

drop policy if exists "Admins can manage waitlist" on public.waitlist_signups;
create policy "Admins can manage waitlist"
on public.waitlist_signups for all
to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

grant select, insert, update, delete on public.admin_emails to authenticated;
grant insert on public.waitlist_signups to anon, authenticated;
grant select, update, delete on public.waitlist_signups to authenticated;
grant usage, select on sequence public.waitlist_signups_id_seq to anon, authenticated;
