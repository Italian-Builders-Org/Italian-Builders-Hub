alter table public.telegram_digest_messages
add column if not exists from_user_id bigint,
add column if not exists from_username text,
add column if not exists from_first_name text,
add column if not exists from_last_name text,
add column if not exists from_is_bot boolean,
add column if not exists sender_chat_id bigint,
add column if not exists sender_chat_title text,
add column if not exists moderation_checked_at timestamptz,
add column if not exists moderation_status text not null default 'pending',
add column if not exists moderation_result_json jsonb not null default '{}'::jsonb;

alter table public.telegram_digest_messages
drop constraint if exists telegram_digest_messages_moderation_status_check;

alter table public.telegram_digest_messages
add constraint telegram_digest_messages_moderation_status_check
check (moderation_status in ('pending', 'clean', 'flagged', 'legacy_skipped'));

create table public.telegram_moderation_flags (
  id uuid primary key default gen_random_uuid(),
  chat_id bigint not null references public.telegram_digest_chats(chat_id) on delete cascade,
  message_id bigint not null,
  message_thread_id bigint,
  message_sent_at timestamptz not null,
  from_user_id bigint,
  from_username text,
  from_display_name text,
  rule_key text not null,
  severity text not null,
  reason text not null,
  evidence text,
  status text not null default 'open',
  moderation_model text,
  raw_result jsonb not null default '{}'::jsonb,
  notified_at timestamptz,
  alert_message_id bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint telegram_moderation_flags_rule_key_check
    check (rule_key in (
      'empty_self_promo',
      'aggressive_dm_recruiting',
      'persistent_offtopic',
      'personal_attack_flame',
      'crypto_shilling_gain_scheme',
      'blasphemy'
    )),
  constraint telegram_moderation_flags_severity_check
    check (severity in ('low', 'medium', 'high')),
  constraint telegram_moderation_flags_status_check
    check (status in ('open', 'dismissed', 'resolved')),
  unique (chat_id, message_id)
);

create index telegram_digest_messages_moderation_pending_idx
on public.telegram_digest_messages (moderation_status, sent_at)
where moderation_status = 'pending';

create index telegram_moderation_flags_status_idx
on public.telegram_moderation_flags (status, created_at desc);

create trigger telegram_moderation_flags_touch_updated_at
before update on public.telegram_moderation_flags
for each row execute function public.touch_updated_at();

alter table public.telegram_moderation_flags enable row level security;

revoke all on public.telegram_moderation_flags from anon, authenticated;

update public.telegram_digest_messages
set moderation_checked_at = now(),
    moderation_status = 'legacy_skipped',
    moderation_result_json = jsonb_build_object('reason', 'Existing messages before moderation rollout were not backfilled.')
where moderation_checked_at is null;
