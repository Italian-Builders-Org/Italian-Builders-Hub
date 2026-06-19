import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeHttpUrlInput,
  normalizeSocialUrl,
  sanitizeHttpUrl,
} from "../artifacts/italian-builders/src/lib/url-safety";

test("sanitizeHttpUrl allows only absolute http and https URLs", () => {
  assert.equal(
    sanitizeHttpUrl("https://example.com/path"),
    "https://example.com/path",
  );
  assert.equal(
    sanitizeHttpUrl("http://example.com/path"),
    "http://example.com/path",
  );
  assert.equal(sanitizeHttpUrl("javascript:alert(1)"), "");
  assert.equal(sanitizeHttpUrl("data:text/html,hi"), "");
  assert.equal(sanitizeHttpUrl("/relative"), "");
});

test("normalizeHttpUrlInput adds https to host-like values and rejects unsafe schemes", () => {
  assert.equal(
    normalizeHttpUrlInput("example.com/path"),
    "https://example.com/path",
  );
  assert.equal(normalizeHttpUrlInput("https://example.com/"), "https://example.com/");
  assert.equal(normalizeHttpUrlInput("javascript:alert(1)"), "");
});

test("normalizeSocialUrl canonicalizes handles and rejects unsafe schemes", () => {
  assert.equal(
    normalizeSocialUrl("@builder", "https://x.com/"),
    "https://x.com/builder",
  );
  assert.equal(
    normalizeSocialUrl("/company/test", "https://linkedin.com/in/"),
    "https://linkedin.com/in/company/test",
  );
  assert.equal(normalizeSocialUrl("javascript:alert(1)", "https://x.com/"), "");
});
