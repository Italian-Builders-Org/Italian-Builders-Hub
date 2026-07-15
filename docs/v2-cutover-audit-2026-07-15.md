# V2 cutover audit

Date: July 15, 2026

## Outcome

V2 is the only routed website version. Canonical root paths now serve V2 for public pages, member flows, and admin flows. The former `/hp-2` preview paths permanently redirect to their equivalent canonical routes. V1 has no navigation entry point or style selector.

No database, migration, storage, email, or server-side data work was part of this cutover.

## Coverage

| Area               | Canonical route                                              | V2 coverage verified                                                                      |
| ------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Homepage           | `/`                                                          | Hero, manifesto, live/fallback statistics, directory, map, join form, footer              |
| Builders           | `/builders`                                                  | Public/member visibility, search, role filter, signed-in discovery filters, profile links |
| Builder profile    | `/builders/:username`                                        | Identity, biography, links, details, skills, needs, languages, personal projects          |
| Projects           | `/projects`                                                  | Search, category filtering, cards, detail links                                           |
| Project detail     | `/projects/:slug`                                            | Description, owner, contributors, needs, external links                                   |
| Community projects | `/community-projects`                                        | Directory and detail coverage, contributors and links                                     |
| Content            | `/content`                                                   | Search, tag filtering, ordered media cards, original-source labels                        |
| Open source        | `/os-projects`                                               | Shared project listing and status metadata                                                |
| Pantheon           | `/pantheon`                                                  | Category/search filters plus full biographies, facts, media, contributions, and sources   |
| Mission            | `/mission`                                                   | Full manifesto copy and join call to action                                               |
| Join               | `/join`                                                      | Waitlist fields, validation, Turnstile integration, status handling                       |
| Privacy            | `/privacy`                                                   | Full V1 policy coverage plus cookie-settings control                                      |
| Terms              | `/terms`                                                     | Full V1 terms coverage                                                                    |
| Authentication     | `/login`, `/login-code`, `/reset-password`, `/invite/:token` | V2 shell and existing auth behavior                                                       |
| Member area        | `/dashboard/*`                                               | Dashboard, digest, profile, project, contribution, and editor routes                      |
| Admin              | `/admin/*`                                                   | Waitlist, invite, member, content, and community-project routes                           |

## Canonical and archive checks

- Public canonical tags resolve to `https://italianbuilders.co/<route>`.
- Private and authentication routes use canonical root paths with `noindex, nofollow`.
- Sitemap entries contain canonical root routes only.
- Internal V2 navigation contains no `/hp-2` links.
- `/hp-2`, public preview routes, member preview routes, and admin preview routes redirect to the matching canonical path.
- Vercel and Cloudflare Pages redirect rules cover the archived prefix.
- `robots.txt` excludes private routes and the archived preview prefix.

## Verification completed

- TypeScript check passed.
- Production Vite build passed.
- 17 directly runnable server/API tests passed.
- All public, login, dashboard, and admin route shells rendered without a not-found state.
- All audited routes rendered the V2 shell with no V1 style selector.
- All public routes rendered without horizontal overflow at 390 px width.
- Pantheon biography open/close interaction passed.
- The V2 map rendered interactive canvas hit targets with pointer events enabled.
- Final homepage browser console had no warnings or errors.
