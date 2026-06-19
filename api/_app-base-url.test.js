const assert = require("node:assert/strict");
const test = require("node:test");
const { appBaseUrl } = require("./_app-base-url");

test("uses configured APP_BASE_URL without trailing slashes", () => {
  const url = appBaseUrl(
    { headers: { host: "evil.example" } },
    { APP_BASE_URL: "https://italianbuilders.co///", NODE_ENV: "production" },
  );

  assert.equal(url, "https://italianbuilders.co");
});

test("requires APP_BASE_URL in production", () => {
  assert.throws(
    () =>
      appBaseUrl(
        { headers: { host: "attacker.example" } },
        { NODE_ENV: "production" },
      ),
    /APP_BASE_URL is required in production/,
  );
});

test("requires APP_BASE_URL in Vercel production", () => {
  assert.throws(
    () =>
      appBaseUrl(
        { headers: { host: "attacker.example" } },
        { VERCEL_ENV: "production" },
      ),
    /APP_BASE_URL is required in production/,
  );
});

test("rejects non-http configured APP_BASE_URL", () => {
  assert.throws(
    () =>
      appBaseUrl(
        { headers: { host: "attacker.example" } },
        { APP_BASE_URL: "javascript:alert(1)", NODE_ENV: "production" },
      ),
    /APP_BASE_URL must be an http or https URL/,
  );
});

test("falls back to request host outside production", () => {
  const url = appBaseUrl(
    {
      headers: {
        "x-forwarded-host": "localhost:5173",
        "x-forwarded-proto": "http",
      },
    },
    { NODE_ENV: "development" },
  );

  assert.equal(url, "http://localhost:5173");
});
