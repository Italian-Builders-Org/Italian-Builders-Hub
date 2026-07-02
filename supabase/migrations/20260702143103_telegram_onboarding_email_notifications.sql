alter table public.telegram_onboarding_email_deliveries
add column if not exists telegram_notification_sent_at timestamptz,
add column if not exists telegram_notification_error text,
add column if not exists telegram_notification_attempts integer not null default 0,
add column if not exists telegram_notification_message_id bigint;

alter table public.telegram_onboarding_email_deliveries
drop constraint if exists telegram_onboarding_email_deliveries_notification_attempts_chec;

alter table public.telegram_onboarding_email_deliveries
drop constraint if exists telegram_email_delivery_notify_attempts_check;

alter table public.telegram_onboarding_email_deliveries
add constraint telegram_email_delivery_notify_attempts_check
check (telegram_notification_attempts >= 0);
