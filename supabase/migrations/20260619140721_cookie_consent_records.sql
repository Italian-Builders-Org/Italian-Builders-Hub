create table if not exists public.cookie_consents (
  id uuid primary key default gen_random_uuid(),
  consent_id uuid not null,
  user_id uuid references auth.users(id) on delete set null,
  consent_version text not null,
  policy_version text not null,
  terms_version text not null,
  necessary boolean not null default true,
  analytics boolean not null default false,
  marketing boolean not null default false,
  action text not null default 'necessary_accepted',
  page_path text,
  client_saved_at timestamptz,
  ip_address inet,
  user_agent text,
  accept_language text,
  referer text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint cookie_consents_necessary_required check (necessary is true),
  constraint cookie_consents_optional_categories_disabled check (
    analytics is false
    and marketing is false
  ),
  constraint cookie_consents_action_check check (
    action in ('necessary_accepted', 'settings_saved')
  )
);

alter table public.cookie_consents enable row level security;

create index if not exists cookie_consents_consent_id_created_idx
on public.cookie_consents (consent_id, created_at desc);

create index if not exists cookie_consents_user_created_idx
on public.cookie_consents (user_id, created_at desc)
where user_id is not null;

create index if not exists cookie_consents_created_idx
on public.cookie_consents (created_at desc);

drop policy if exists "Admins can read cookie consent records" on public.cookie_consents;
create policy "Admins can read cookie consent records"
on public.cookie_consents for select
to authenticated
using (private.is_platform_admin());

grant select on public.cookie_consents to authenticated;
