const assert = require("node:assert/strict");
const test = require("node:test");
const { jsonLdScriptContent, siteOrigin } = require("./_profile-og");
const builderProfileHandler = require("../../api/builder-profile");

const xssPayload =
  '</script><script>alert(location.origin)</script><script type="application/ld+json">';

test("serializes JSON-LD for an HTML script context", () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: `Builder ${xssPayload}`,
    description: "A&B\u2028C\u2029D",
  };

  const serialized = jsonLdScriptContent(schema);

  assert.doesNotMatch(serialized, /<\/script/i);
  assert.doesNotMatch(serialized, /<script/i);
  assert.match(serialized, /\\u003c\/script\\u003e/);
  assert.match(serialized, /\\u0026/);
  assert.deepEqual(JSON.parse(serialized), schema);
});

test("builder profile HTML does not emit executable JSON-LD text", () => {
  const html = builderProfileHandler._internal.injectMetadata(
    "<!doctype html><html><head><title>Old</title></head><body></body></html>",
    {
      title: `Builder ${xssPayload}`,
      description: `Profile ${xssPayload}`,
      origin: "https://italianbuilders.co",
      url: "https://italianbuilders.co/builders/domenico",
      image:
        "https://italianbuilders.co/api/og-profile-image?username=domenico",
      imageAlt: `Builder ${xssPayload}`,
      profile: {
        full_name: `Domenico ${xssPayload}`,
        username: "domenico",
        headline: `Founder ${xssPayload}`,
        role: "Founder",
        bio: `Bio ${xssPayload}`,
        avatar_url: "/avatar.png",
        skills: [`Skill ${xssPayload}`],
        city: "Milan",
        country: "Italy",
      },
    },
  );

  assert.doesNotMatch(html, /<script>alert\(location\.origin\)<\/script>/i);
  assert.doesNotMatch(
    html,
    /<\/script><script>alert\(location\.origin\)<\/script>/i,
  );
  assert.match(html, /\\u003c\/script\\u003e/);
  assert.match(html, /<script type="application\/ld\+json">/);
  assert.equal(html.match(/<script type="application\/ld\+json">/g)?.length, 2);
  const scripts = [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ].map((match) => JSON.parse(match[1]));
  assert.equal(scripts[0]["@type"], "Organization");
  assert.equal(scripts[1]["@type"], "ProfilePage");
  assert.ok(!Array.isArray(scripts[0]));
  assert.ok(!Array.isArray(scripts[1]));
});

test("server profile origin ignores browser build base URL", () => {
  const previousAppBaseUrl = process.env.APP_BASE_URL;
  const previousViteAppBaseUrl = process.env.VITE_APP_BASE_URL;
  delete process.env.APP_BASE_URL;
  process.env.VITE_APP_BASE_URL = "https://italian-builders.vercel.app";
  try {
    const origin = siteOrigin({
      headers: {
        "x-forwarded-host": "italianbuilders.co",
        "x-forwarded-proto": "https",
      },
    });

    assert.equal(origin, "https://italianbuilders.co");
  } finally {
    if (previousAppBaseUrl === undefined) delete process.env.APP_BASE_URL;
    else process.env.APP_BASE_URL = previousAppBaseUrl;
    if (previousViteAppBaseUrl === undefined)
      delete process.env.VITE_APP_BASE_URL;
    else process.env.VITE_APP_BASE_URL = previousViteAppBaseUrl;
  }
});
