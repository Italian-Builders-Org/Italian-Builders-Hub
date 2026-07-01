create table public.telegram_digest_chats (
  chat_id bigint primary key,
  chat_title text not null,
  chat_type text not null,
  summary_context text,
  is_enabled boolean not null default true,
  report_language text not null default 'it',
  report_time_zone text not null default 'Europe/Rome',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint telegram_digest_chats_report_language_check
    check (report_language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  constraint telegram_digest_chats_time_zone_check
    check (length(report_time_zone) between 3 and 64)
);

create table public.telegram_digest_messages (
  id uuid primary key default gen_random_uuid(),
  update_id bigint not null unique,
  update_type text not null,
  chat_id bigint not null references public.telegram_digest_chats(chat_id) on delete cascade,
  message_id bigint not null,
  message_thread_id bigint,
  sent_at timestamptz not null,
  message_local_date date generated always as ((sent_at at time zone 'Europe/Rome')::date) stored,
  text text not null,
  text_urls text[] not null default '{}',
  text_char_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint telegram_digest_messages_text_not_blank check (length(btrim(text)) > 0),
  constraint telegram_digest_messages_update_type_check
    check (update_type in ('message', 'edited_message', 'channel_post', 'edited_channel_post')),
  constraint telegram_digest_messages_text_char_count_check
    check (text_char_count >= 0),
  unique (chat_id, message_id)
);

create table public.telegram_daily_reports (
  id uuid primary key default gen_random_uuid(),
  report_scope text not null default 'community',
  chat_id bigint references public.telegram_digest_chats(chat_id) on delete cascade,
  report_date date not null,
  message_count integer not null default 0,
  active_chat_count integer not null default 0,
  report_text text not null,
  summary_json jsonb not null default '{}'::jsonb,
  model text not null,
  prompt_version text not null,
  sent_message_id bigint,
  raw_response jsonb,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint telegram_daily_reports_message_count_check check (message_count >= 0),
  constraint telegram_daily_reports_active_chat_count_check check (active_chat_count >= 0),
  constraint telegram_daily_reports_scope_check check (report_scope in ('community')),
  constraint telegram_daily_reports_text_not_blank check (length(btrim(report_text)) > 0),
  unique (report_scope, report_date)
);

create index telegram_digest_chats_enabled_idx
on public.telegram_digest_chats (is_enabled, chat_title);

create index telegram_digest_messages_daily_idx
on public.telegram_digest_messages (chat_id, message_local_date, sent_at);

create index telegram_daily_reports_date_idx
on public.telegram_daily_reports (report_date desc, chat_id);

create trigger telegram_digest_chats_touch_updated_at
before update on public.telegram_digest_chats
for each row execute function public.touch_updated_at();

create trigger telegram_digest_messages_touch_updated_at
before update on public.telegram_digest_messages
for each row execute function public.touch_updated_at();

create trigger telegram_daily_reports_touch_updated_at
before update on public.telegram_daily_reports
for each row execute function public.touch_updated_at();

alter table public.telegram_digest_chats enable row level security;
alter table public.telegram_digest_messages enable row level security;
alter table public.telegram_daily_reports enable row level security;

revoke all on public.telegram_digest_chats from anon, authenticated;
revoke all on public.telegram_digest_messages from anon, authenticated;
revoke all on public.telegram_daily_reports from anon, authenticated;

grant select on public.telegram_daily_reports to authenticated;

create policy "Members can read generated Telegram digests"
on public.telegram_daily_reports for select
to authenticated
using (auth.uid() is not null);
