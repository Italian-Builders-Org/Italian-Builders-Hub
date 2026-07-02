alter table public.profiles
add column if not exists telegram_bot_username text,
add column if not exists telegram_bot_username_set_at timestamptz;

alter table public.profiles
drop constraint if exists profiles_telegram_bot_username_format;

alter table public.profiles
add constraint profiles_telegram_bot_username_format
check (
  telegram_bot_username is null
  or telegram_bot_username ~ '^@?[A-Za-z0-9_]{5,32}$'
);

create table public.telegram_onboarding_contacts (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null unique,
  private_chat_id bigint unique,
  username text,
  first_name text,
  last_name text,
  language_code text,
  website_profile_id uuid unique references public.profiles(id) on delete set null,
  website_profile_linked_at timestamptz,
  started_at timestamptz,
  last_private_seen_at timestamptz,
  last_group_seen_at timestamptz,
  blocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint telegram_onboarding_contacts_username_format check (
    username is null
    or username ~ '^@?[A-Za-z0-9_]{5,32}$'
  )
);

create table public.telegram_onboarding_sessions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.telegram_onboarding_contacts(id) on delete cascade,
  state text not null default 'idle',
  payload jsonb not null default '{}'::jsonb,
  waitlist_signup_id bigint references public.waitlist_signups(id) on delete set null,
  invite_id uuid references public.invites(id) on delete set null,
  action_link_sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint telegram_onboarding_sessions_state_check check (
    state in (
      'idle',
      'awaiting_profile_status',
      'awaiting_handle_match_confirmation',
      'awaiting_handle_mismatch_choice',
      'awaiting_existing_email',
      'awaiting_name',
      'awaiting_email',
      'awaiting_role',
      'awaiting_building',
      'magic_link_email_sent',
      'completed',
      'linked_existing_profile'
    )
  )
);

create table public.telegram_onboarding_flags (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.telegram_onboarding_contacts(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  flag_type text not null,
  severity text not null default 'review',
  status text not null default 'open',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint telegram_onboarding_flags_type_not_blank check (length(btrim(flag_type)) > 0),
  constraint telegram_onboarding_flags_severity_check check (severity in ('review', 'high')),
  constraint telegram_onboarding_flags_status_check check (status in ('open', 'resolved', 'ignored'))
);

alter table public.waitlist_signups
add column if not exists telegram_onboarding_contact_id uuid
  references public.telegram_onboarding_contacts(id) on delete set null;

alter table public.invites
add column if not exists telegram_onboarding_contact_id uuid
  references public.telegram_onboarding_contacts(id) on delete set null,
add column if not exists delivery_channel text not null default 'email';

update public.invites
set delivery_channel = 'manual'
where email is null
  and delivery_channel = 'email';

alter table public.invites
drop constraint if exists invites_delivery_channel_check;

alter table public.invites
add constraint invites_delivery_channel_check
check (delivery_channel in ('email', 'manual', 'telegram_bot'));

create index if not exists telegram_onboarding_contacts_profile_idx
on public.telegram_onboarding_contacts (website_profile_id);

create index if not exists telegram_onboarding_contacts_username_idx
on public.telegram_onboarding_contacts (lower(coalesce(username, '')));

create unique index if not exists profiles_telegram_bot_username_unique_idx
on public.profiles (lower(telegram_bot_username))
where telegram_bot_username is not null;

create index if not exists telegram_onboarding_sessions_contact_created_idx
on public.telegram_onboarding_sessions (contact_id, created_at desc);

create index if not exists telegram_onboarding_sessions_state_idx
on public.telegram_onboarding_sessions (state, created_at desc);

create index if not exists telegram_onboarding_flags_contact_idx
on public.telegram_onboarding_flags (contact_id, created_at desc);

create index if not exists telegram_onboarding_flags_status_idx
on public.telegram_onboarding_flags (status, severity, created_at desc);

create index if not exists waitlist_signups_telegram_onboarding_contact_idx
on public.waitlist_signups (telegram_onboarding_contact_id);

create index if not exists invites_telegram_onboarding_contact_idx
on public.invites (telegram_onboarding_contact_id);

create trigger telegram_onboarding_contacts_touch_updated_at
before update on public.telegram_onboarding_contacts
for each row execute function public.touch_updated_at();

create trigger telegram_onboarding_sessions_touch_updated_at
before update on public.telegram_onboarding_sessions
for each row execute function public.touch_updated_at();

create trigger telegram_onboarding_flags_touch_updated_at
before update on public.telegram_onboarding_flags
for each row execute function public.touch_updated_at();

alter table public.telegram_onboarding_contacts enable row level security;
alter table public.telegram_onboarding_sessions enable row level security;
alter table public.telegram_onboarding_flags enable row level security;

revoke all on public.telegram_onboarding_contacts from anon, authenticated;
revoke all on public.telegram_onboarding_sessions from anon, authenticated;
revoke all on public.telegram_onboarding_flags from anon, authenticated;

grant select, insert, update, delete on public.telegram_onboarding_contacts to authenticated;
grant select, insert, update, delete on public.telegram_onboarding_sessions to authenticated;
grant select, insert, update, delete on public.telegram_onboarding_flags to authenticated;

drop policy if exists "Admins can manage Telegram onboarding contacts"
on public.telegram_onboarding_contacts;

create policy "Admins can manage Telegram onboarding contacts"
on public.telegram_onboarding_contacts for all
to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists "Admins can manage Telegram onboarding sessions"
on public.telegram_onboarding_sessions;

create policy "Admins can manage Telegram onboarding sessions"
on public.telegram_onboarding_sessions for all
to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists "Admins can manage Telegram onboarding flags"
on public.telegram_onboarding_flags;

create policy "Admins can manage Telegram onboarding flags"
on public.telegram_onboarding_flags for all
to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

create or replace function public.link_telegram_onboarding_invite()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  contact_row public.telegram_onboarding_contacts;
begin
  if new.telegram_onboarding_contact_id is null
    or new.accepted_by is null
    or new.status <> 'accepted'
    or old.status = 'accepted'
  then
    return new;
  end if;

  select *
  into contact_row
  from public.telegram_onboarding_contacts
  where id = new.telegram_onboarding_contact_id;

  if not found then
    return new;
  end if;

  update public.telegram_onboarding_contacts
  set
    website_profile_id = new.accepted_by,
    website_profile_linked_at = now()
  where id = contact_row.id;

  if contact_row.username is not null then
    update public.profiles
    set
      telegram_bot_username = contact_row.username,
      telegram_bot_username_set_at = now()
    where id = new.accepted_by;
  end if;

  return new;
end;
$$;

drop trigger if exists invites_link_telegram_onboarding on public.invites;

create trigger invites_link_telegram_onboarding
after update of status, accepted_by on public.invites
for each row execute function public.link_telegram_onboarding_invite();
