create table if not exists public.waitlist_email_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token_hash text not null unique,
  payload jsonb not null,
  status text not null default 'pending',
  expires_at timestamptz not null,
  verified_at timestamptz,
  sent_at timestamptz,
  email_error text,
  created_at timestamptz not null default now(),
  constraint waitlist_email_verifications_email_lowercase check (email = lower(email)),
  constraint waitlist_email_verifications_status_check check (status in ('pending', 'verified', 'expired'))
);

create index if not exists waitlist_email_verifications_email_created_idx
on public.waitlist_email_verifications (email, created_at desc);

create index if not exists waitlist_email_verifications_status_expires_idx
on public.waitlist_email_verifications (status, expires_at);

alter table public.waitlist_email_verifications enable row level security;

drop policy if exists "Admins can read waitlist email verifications" on public.waitlist_email_verifications;
create policy "Admins can read waitlist email verifications"
on public.waitlist_email_verifications for select
to authenticated
using (private.is_platform_admin());

drop policy if exists "Admins can manage waitlist email verifications" on public.waitlist_email_verifications;
create policy "Admins can manage waitlist email verifications"
on public.waitlist_email_verifications for all
to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists "Anyone can join the waitlist" on public.waitlist_signups;

grant select, insert, update, delete on public.waitlist_email_verifications to authenticated;
