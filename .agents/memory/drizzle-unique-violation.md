---
name: Drizzle unique-violation 409
description: How to detect Postgres unique-constraint violations when using Drizzle + node-postgres, for returning HTTP 409.
---

When a Drizzle `db.insert(...)` hits a Postgres unique constraint, the thrown error is a Drizzle wrapper, not the raw `pg` error. The Postgres error code `23505` lives on the wrapped error's `cause`, not on the top-level error object.

**Rule:** to map a duplicate-key insert to HTTP 409, check the code on BOTH the error and its `cause`:

```ts
const getCode = (e: unknown) =>
  e && typeof e === "object" && "code" in e ? (e as { code?: string }).code : undefined;
const cause = err && typeof err === "object" && "cause" in err ? (err as { cause?: unknown }).cause : undefined;
if (getCode(err) === "23505" || getCode(cause) === "23505") { /* 409 */ }
```

**Why:** checking only `err.code` silently fails (returns 500 with an HTML stack-trace page) because the code is nested under `cause`. Verified: top-level check alone returned 500; adding the `cause` check produced the expected 409.

**How to apply:** any Express route doing a Drizzle insert/update against a table with a unique column (e.g. waitlist email) that should return 409 on conflict.
