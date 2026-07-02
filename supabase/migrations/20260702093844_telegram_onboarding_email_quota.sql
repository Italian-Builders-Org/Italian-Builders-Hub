alter table public.telegram_onboarding_sessions
drop constraint if exists telegram_onboarding_sessions_state_check;

alter table public.telegram_onboarding_sessions
add constraint telegram_onboarding_sessions_state_check
check (
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
    'email_quota_waiting',
    'completed',
    'linked_existing_profile'
  )
);

create table if not exists public.telegram_onboarding_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.telegram_onboarding_contacts(id) on delete set null,
  session_id uuid references public.telegram_onboarding_sessions(id) on delete set null,
  email text not null,
  purpose text not null,
  status text not null default 'sent',
  quota_date date not null default ((now() at time zone 'Europe/Rome')::date),
  redirect_to text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint telegram_onboarding_email_deliveries_email_format check (
    email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint telegram_onboarding_email_deliveries_purpose_not_blank check (
    length(btrim(purpose)) > 0
  ),
  constraint telegram_onboarding_email_deliveries_status_check check (
    status in ('sent', 'queued', 'failed')
  )
);

create index if not exists telegram_onboarding_email_deliveries_quota_idx
on public.telegram_onboarding_email_deliveries (quota_date, status, created_at desc);

create index if not exists telegram_onboarding_email_deliveries_queue_idx
on public.telegram_onboarding_email_deliveries (status, scheduled_for, created_at)
where status = 'queued';

create index if not exists telegram_onboarding_email_deliveries_contact_idx
on public.telegram_onboarding_email_deliveries (contact_id, created_at desc);

drop trigger if exists telegram_onboarding_email_deliveries_touch_updated_at
on public.telegram_onboarding_email_deliveries;

create trigger telegram_onboarding_email_deliveries_touch_updated_at
before update on public.telegram_onboarding_email_deliveries
for each row execute function public.touch_updated_at();

alter table public.telegram_onboarding_email_deliveries enable row level security;

revoke all on public.telegram_onboarding_email_deliveries from anon, authenticated;
grant select, insert, update, delete on public.telegram_onboarding_email_deliveries to authenticated;

drop policy if exists "Admins can manage Telegram onboarding email deliveries"
on public.telegram_onboarding_email_deliveries;

create policy "Admins can manage Telegram onboarding email deliveries"
on public.telegram_onboarding_email_deliveries for all
to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());
