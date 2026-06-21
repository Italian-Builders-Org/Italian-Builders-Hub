# Security Report - 2026-06-19

## Summary

This report updates the repository security scan completed on 2026-06-19 for Italian Builders Hub.

Original scan result:

- 11 reportable findings
- 2 high severity
- 6 medium severity
- 3 low severity
- Scope: public website/API routes, Supabase RLS/RPC boundaries, invite/waitlist flows, media upload/storage, server-side fetches, and frontend link rendering

Implementation status:

- The two high-severity findings are fixed in code.
- Most medium-severity application findings are fixed in code.
- The dependency advisory is fixed in the lockfile.
- Remaining work is mostly deployment/runtime validation and one lower-risk anonymous consent endpoint.

## Fixed

| Finding | Original severity | Status | Fix |
| --- | --- | --- | --- |
| Authenticated OG image import can fetch internal or private URLs | High | Fixed | Added `api/_safe-fetch.js`; `api/og-image.js` now validates DNS, IP ranges, and every redirect hop before fetching the submitted page URL or discovered OG image. |
| Members can self-promote to admin by changing profile email | High | Fixed | Added `supabase/migrations/20260619190000_harden_profile_roles.sql`; platform roles are no longer inferred from mutable `profiles.email`, and non-admin users cannot change `platform_role` or profile email directly. |
| Public profile OG renderer can load user-controlled remote images | Medium | Fixed | `api/og-profile-image.js` now uses the safe fetch path and embeds validated remote images as data URLs, avoiding arbitrary remote fetches by the OG renderer. |
| Verification and invite links can be poisoned from Host headers when `APP_BASE_URL` is unset | Medium | Fixed | Added `api/_app-base-url.js`; production now requires a configured HTTP(S) `APP_BASE_URL`, with request-host fallback only outside production. |
| Presigned R2 uploads trust client-declared size | Medium | Fixed | Added `api/media-upload.js`; media uploads now pass through the server, which enforces actual byte size before uploading to R2. The old presigned endpoint returns `410`. |
| Invite acceptance is not bound to the invited email account | Medium | Fixed | Added `supabase/migrations/20260619191000_harden_invite_acceptance.sql`; email-bound invites require the authenticated email to match the invite email. Telegram-only invites still support signed-in token-holder acceptance. |
| Invite token lookup exposes waitlist details before authentication | Low | Fixed | Updated `get_invite_by_token`; anonymous or non-matching callers now receive only minimal invite validity/status data. Full prefill data requires matching invite email or platform admin. |
| Stored external link fields allow unsafe URI schemes | Medium | Fixed | Added `artifacts/italian-builders/src/lib/url-safety.ts`; external profile/project links are sanitized before rendering and before normal UI writes. Unsafe schemes like `javascript:` and `data:` are dropped. |
| Production API dependency tree contains a moderate `qs` DoS advisory | Low | Fixed | Added a pnpm override and refreshed the lockfile so the API server resolves `qs@6.15.2`; `pnpm audit --prod` reports no known vulnerabilities. |
| Public waitlist endpoint can amplify database writes and verification emails | Medium | Mostly fixed in current branch | Current branch includes Cloudflare Turnstile protection for the waitlist form/API path. Production still needs Turnstile secrets configured and should add rate limits/dedupe as defense in depth. |

## Still To Fix

| Item | Priority | Notes |
| --- | --- | --- |
| Public consent endpoint permits unauthenticated write amplification | Low | Add lightweight request throttling, dedupe, and payload limits to `api/consent.js`. |
| Production runtime validation for Supabase migrations | High before deploy | Apply migrations in a staging database and verify role/invite behavior with real Supabase Auth claims. Local Supabase DB lint could not be run because the local Postgres listener was unavailable. |
| Production environment configuration | High before deploy | Ensure `APP_BASE_URL` is set to the canonical production origin and Turnstile secrets/site keys are configured. Missing `APP_BASE_URL` now fails closed in production. |
| Waitlist abuse defense in depth | Medium | Turnstile is present, but rate limiting, pending-request dedupe, email send quotas, and Cloudflare WAF rules should still be added. |
| R2 operational controls | Medium | Configure bucket lifecycle/quota monitoring and alerting. Server-side byte limits are now enforced, but infrastructure limits should also exist. |
| Post-deploy focused security retest | Medium | Re-run the SSRF, invite, admin role, upload, and waitlist abuse checks against staging/production after deployment. |

## Verification Performed

Commands that passed after the fixes:

```bash
node --test api/_safe-fetch.test.js
node --test api/_app-base-url.test.js
pnpm --filter ./scripts exec tsx --test ../tests/url-safety.test.ts
node --check api/media-upload.js
node --check api/og-image.js
node --check api/og-profile-image.js
node --check api/_safe-fetch.js
node --check api/_app-base-url.js
pnpm run typecheck
pnpm run build
pnpm audit --prod
```

Additional pattern checks:

- No `redirect: "follow"` remains in the API fetch paths.
- The browser no longer calls the retired presigned media upload endpoint.
- The final role trigger no longer derives admin privileges from `profiles.email`.
- External profile/project links route through HTTP(S)-only sanitization.

## Deployment Notes

Before deploying these fixes:

1. Apply the two new Supabase migrations in staging first.
2. Verify a normal member cannot update `platform_role` or mutate profile email into an admin address.
3. Verify an email invite can only be accepted by the invited authenticated email.
4. Verify a Telegram-only invite still works for the signed-in token holder.
5. Set `APP_BASE_URL` in production.
6. Set Cloudflare Turnstile environment variables if waitlist protection is being deployed from the current branch.
7. Re-run `pnpm audit --prod` and a focused smoke test after deployment.
