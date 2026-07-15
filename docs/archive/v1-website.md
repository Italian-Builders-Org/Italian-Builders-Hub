# V1 website archive

V1 was retired from runtime routing on July 15, 2026. V2 is now the only website version served from the canonical public, member, and admin routes.

## Cutover map

| Archived entry point       | Canonical route       |
| -------------------------- | --------------------- |
| `/hp-2`                    | `/`                   |
| `/hp-2/builders`           | `/builders`           |
| `/hp-2/projects`           | `/projects`           |
| `/hp-2/community-projects` | `/community-projects` |
| `/hp-2/content`            | `/content`            |
| `/hp-2/os-projects`        | `/os-projects`        |
| `/hp-2/pantheon`           | `/pantheon`           |
| `/hp-2/mission`            | `/mission`            |
| `/hp-2/join`               | `/join`               |
| `/hp-2/privacy`            | `/privacy`            |
| `/hp-2/terms`              | `/terms`              |
| `/hp-2/login`              | `/login`              |
| `/hp-2/dashboard/*`        | `/dashboard/*`        |
| `/hp-2/admin/*`            | `/admin/*`            |

Permanent redirects preserve old preview links. The sitemap, internal navigation, structured data, Open Graph URLs, and canonical tags use only the canonical routes.

The former V1 page modules remain in Git history as the rollback archive. They are not imported by the application entry point and have no runtime routes or public style switch.
