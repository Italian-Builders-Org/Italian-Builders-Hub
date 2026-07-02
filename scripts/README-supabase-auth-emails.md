# Supabase Auth Emails

`apply-supabase-auth-emails.mjs` builds the branded Italian Builders Auth email configuration for Supabase.

It configures:

- Resend SMTP for Supabase Auth
- `no-reply@italianbuilders.co` as the Auth sender
- Auth email, OTP and verification rate limits aligned with the onboarding queue
- all 6 authentication email templates
- all 7 security notification templates
- all matching subject lines

Run a local payload check without exposing secrets:

```sh
node scripts/apply-supabase-auth-emails.mjs --dry-run
```

Apply to Supabase when `SUPABASE_ACCESS_TOKEN` is a valid Supabase Management API token:

```sh
node scripts/apply-supabase-auth-emails.mjs
```
