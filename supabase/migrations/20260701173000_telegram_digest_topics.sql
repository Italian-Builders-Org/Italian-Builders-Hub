create table public.telegram_digest_topics (
  chat_id bigint not null references public.telegram_digest_chats(chat_id) on delete cascade,
  message_thread_id bigint not null,
  topic_name text not null,
  icon_color integer,
  icon_custom_emoji_id text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (chat_id, message_thread_id),
  constraint telegram_digest_topics_name_not_blank check (length(btrim(topic_name)) > 0)
);

create index telegram_digest_topics_chat_idx
on public.telegram_digest_topics (chat_id, topic_name);

create trigger telegram_digest_topics_touch_updated_at
before update on public.telegram_digest_topics
for each row execute function public.touch_updated_at();

alter table public.telegram_digest_topics enable row level security;

revoke all on public.telegram_digest_topics from anon, authenticated;
