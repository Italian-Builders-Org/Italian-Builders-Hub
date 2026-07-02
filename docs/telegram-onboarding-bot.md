# Telegram Onboarding Bot

This is a separate Telegram bot from the daily digest bot. Its job is user
management and invite delivery, not community summaries.

## What It Does

- Receives private `/start` messages at `/api/telegram-onboarding/webhook`.
- Stores Telegram numeric user IDs and private chat IDs only in
  `public.telegram_onboarding_contacts`, which is admin-only.
- Stores the bot-observed username separately from the user-entered profile
  handle.
- Checks whether the Telegram username already appears on a website profile.
- If one profile matches, shows a partially obfuscated email and asks for
  confirmation. The user can reply `this is not me` if the matched website
  profile is not theirs.
- If multiple profiles match, or the user rejects the handle match, creates an
  admin review flag in `public.telegram_onboarding_flags`.
- If configured, sends those review flags to admin Telegram chat IDs.
- When the bot is added or promoted in a Telegram group/channel, it introduces
  itself and points members to the private onboarding chat.
- Asks whether the user already has a website profile.
- If yes, asks for their website email. For unverified Telegram/profile links,
  it sends the magic login link to the email address, not into Telegram.
- If the user rejects the matched profile, they can reply `create a new account`
  to continue with a separate profile draft.
- If the user says they do not have a website profile but then enters an email
  that already exists, it stops the new-invite flow and sends the magic login
  link to that email instead.
- If the Telegram contact is already linked to the website profile, it can send
  a private Supabase magic login link through Telegram.
- Tracks onboarding email sends against a daily cap. If the cap is reached, it
  queues the magic-link email and tells the user it will be sent when quota
  reopens.
- If not, collects name, email, role, and what they are building.
- Creates or updates the existing `waitlist_signups` row.
- Creates a normal invite row with `delivery_channel = 'telegram_bot'`.
- Generates a Supabase Auth action link and sends it through Telegram, without
  sending a Resend email.

## Setup

1. Create a new bot with `@BotFather`.
2. Configure these environment variables:

```text
TELEGRAM_ONBOARDING_BOT_TOKEN
TELEGRAM_ONBOARDING_WEBHOOK_SECRET
TELEGRAM_ONBOARDING_SETUP_SECRET
TELEGRAM_ONBOARDING_ADMIN_CHAT_IDS
TELEGRAM_ONBOARDING_DAILY_EMAIL_LIMIT
CRON_SECRET
```

3. Apply the migration:

```bash
supabase db push
```

4. Register the webhook:

```bash
curl -X POST "$APP_BASE_URL/api/telegram-onboarding/setup-webhook" \
  -H "Authorization: Bearer $TELEGRAM_ONBOARDING_SETUP_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"dropPendingUpdates":false}'
```

## Handle Precedence

The existing `profiles.telegram_handle` is preserved as the user-entered value.
The bot writes a separate `profiles.telegram_bot_username` when a verified
website-profile link is added. In member-facing contact surfaces, the app should
display:

```text
profiles.telegram_bot_username || profiles.telegram_handle
```

Telegram numeric IDs stay in `telegram_onboarding_contacts`; they should not be
stored directly on `profiles`, because public/member profile reads can expose
profile columns.

`profiles.telegram_bot_username` is unique when set. The user-entered
`profiles.telegram_handle` is still allowed to be messy historical data; handle
conflicts are treated as admin-review signals, not account proof.

## Login Link Safety

A Telegram handle is not proof of account ownership. Anyone can change their
Telegram username to match a public handle, so the bot must not paste a website
login URL into Telegram based only on a handle match or a typed email.

For unverified contacts, the bot sends the magic login link to the profile email
address through Supabase email auth and only shows a partially obfuscated email
in Telegram. Direct Telegram login links are reserved for contacts already linked
to a website profile. Typing an email in Telegram does not link that Telegram
contact to the website profile by itself.

Existing-profile verification is completed by the website, not by Telegram
alone. Bot-generated login-code redirects include a signed Telegram link token;
after the user verifies the email OTP on `/login-code`, the website calls the
backend with the authenticated Supabase session. The backend links the Telegram
contact to the website profile only when the verified session email, profile ID,
Telegram contact, and signed token all match.

## Email Quota

When `RESEND_API_KEY` is configured, the bot checks Resend's sent-email list for
the current Europe/Rome calendar day before asking Supabase Auth to send a magic
login email. This makes the quota guard account-wide instead of only counting
emails initiated by the onboarding bot. The
`public.telegram_onboarding_email_deliveries` table is still used as an audit log
and queue for deferred login emails.

If the Resend API cannot be reached while `RESEND_API_KEY` is configured, the bot
queues the login email instead of sending blindly. In local environments without
`RESEND_API_KEY`, the backend falls back to the internal delivery table so the
flow remains testable.

Set `TELEGRAM_ONBOARDING_DAILY_EMAIL_LIMIT` below the real Resend limit. The
default is 90 so the project keeps room for other transactional emails. When the
limit is reached, the bot queues the magic-link email and the daily cron at
`/api/telegram-onboarding/email-queue` sends queued emails once quota is
available again.
