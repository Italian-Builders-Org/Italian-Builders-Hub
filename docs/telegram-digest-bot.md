# Telegram Daily Digest Bot

This bot records text messages it receives during the day, then creates one
previous-day Italian digest after midnight in Italy.

## What It Does

- Receives Telegram updates at `/api/telegram/webhook`.
- Stores only message text, message links, message IDs, chat IDs, timestamps,
  and chat titles.
- Does not store Telegram user names, handles, or sender IDs.
- Runs `/api/telegram/daily-report` from Vercel Cron at `23:10 UTC`.
- Summarizes the previous `Europe/Rome` calendar day.
- Sends the report only to `TELEGRAM_DIGEST_OWNER_CHAT_ID`.
- Saves the generated report to `public.telegram_daily_reports`, where it is
  readable only by signed-in members.

Telegram bots cannot fetch arbitrary old chat history at the end of the day.
They must receive updates during the day and persist the messages needed for the
digest.

## Setup

1. Create the bot with `@BotFather` and copy the bot token.
2. Apply the Supabase migration:

```bash
supabase db push
```

3. Configure Vercel environment variables:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
TELEGRAM_SETUP_SECRET
TELEGRAM_DIGEST_CRON_SECRET
TELEGRAM_DIGEST_OWNER_CHAT_ID
OPENROUTER_API_KEY
```

4. Deploy the project so `/api/telegram/webhook` is public over HTTPS.
5. Register the webhook:

```bash
curl -X POST "$APP_BASE_URL/api/telegram/setup-webhook" \
  -H "Authorization: Bearer $TELEGRAM_SETUP_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"dropPendingUpdates":false}'
```

6. Add the bot to each Telegram channel or group that needs reports.

For groups, Telegram Privacy Mode means bots see only commands and direct
replies by default. To capture the whole conversation, either make the bot an
admin or disable privacy mode with `@BotFather` `/setprivacy`, then re-add the
bot to the group. For channels, add the bot as an admin/member so Telegram sends
channel post updates.

The bot does not answer inside source channels. It only listens, stores the
message text needed for the digest, sends the finished digest to your configured
private chat ID, and exposes the generated digest inside the member website.

## Channel Tuning

Each chat appears in `public.telegram_digest_chats` after the first message is
received. Set `summary_context` to make the report specific to that channel:

```sql
update public.telegram_digest_chats
set summary_context = 'AI agents, Italian founders, product launches, community demos'
where chat_id = -1001234567890;
```

Disable a channel without removing historical data:

```sql
update public.telegram_digest_chats
set is_enabled = false
where chat_id = -1001234567890;
```

## Manual Run

Use a specific date for backfills or testing:

```bash
curl "$APP_BASE_URL/api/telegram/daily-report?date=2026-07-01&force=1" \
  -H "Authorization: Bearer $TELEGRAM_DIGEST_CRON_SECRET"
```

The endpoint skips a chat if that date already has a sent report unless
`force=1` is passed.
