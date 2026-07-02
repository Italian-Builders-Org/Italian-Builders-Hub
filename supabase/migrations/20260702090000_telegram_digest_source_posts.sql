alter table public.telegram_daily_reports
add column source_posts_json jsonb not null default '[]'::jsonb,
add column source_posts_published_at timestamptz;
